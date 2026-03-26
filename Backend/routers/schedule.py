"""
Schedule Router
===============
Handles time-based website blocking schedules.
Allows admins to create, update, delete, and query scheduled blocks.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from database import db
import json

router = APIRouter(prefix="/api/schedule", tags=["Schedule"])


def _parse_days_of_week(raw_value: Any) -> List[int]:
    """Parse days_of_week from JSON/list/csv and keep only valid day numbers."""
    if raw_value is None:
        return []

    parsed = raw_value
    if isinstance(raw_value, str):
        raw_value = raw_value.strip()
        if not raw_value:
            return []
        try:
            parsed = json.loads(raw_value)
        except json.JSONDecodeError:
            parsed = [part.strip() for part in raw_value.split(",") if part.strip()]

    if not isinstance(parsed, list):
        parsed = [parsed]

    clean_days: List[int] = []
    for day in parsed:
        try:
            day_num = int(day)
            if 0 <= day_num <= 6:
                clean_days.append(day_num)
        except (TypeError, ValueError):
            continue

    # Preserve insertion order while removing duplicates.
    return list(dict.fromkeys(clean_days))


def _is_valid_time_value(time_value: Any) -> bool:
    """Validate HH:MM values safely."""
    if not isinstance(time_value, str):
        return False

    try:
        datetime.strptime(time_value, "%H:%M")
        return True
    except ValueError:
        return False


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ScheduledBlockCreate(BaseModel):
    """Request model for creating a scheduled block."""
    website: str = Field(..., description="Website or domain to block", min_length=1)
    start_time: str = Field(..., description="Start time in HH:MM format", pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    end_time: str = Field(..., description="End time in HH:MM format", pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    days_of_week: List[int] = Field(..., description="Days of week (0=Monday, 6=Sunday)", min_items=1, max_items=7)
    reason: Optional[str] = Field(None, description="Reason for blocking")
    created_by: str = Field(..., description="Admin username who created the schedule")


class ScheduledBlockUpdate(BaseModel):
    """Request model for updating a scheduled block."""
    website: Optional[str] = Field(None, description="Website or domain to block")
    start_time: Optional[str] = Field(None, description="Start time in HH:MM format")
    end_time: Optional[str] = Field(None, description="End time in HH:MM format")
    days_of_week: Optional[List[int]] = Field(None, description="Days of week (0=Monday, 6=Sunday)")
    reason: Optional[str] = Field(None, description="Reason for blocking")
    is_active: Optional[bool] = Field(None, description="Whether the schedule is active")


class ScheduledBlockResponse(BaseModel):
    """Response model for a scheduled block."""
    id: int
    website: str
    start_time: str
    end_time: str
    days_of_week: List[int]
    reason: Optional[str]
    created_by: str
    is_active: bool
    created_at: str
    updated_at: str


class ActiveBlockInfo(BaseModel):
    """Information about currently active blocks."""
    website: str
    end_time: str
    reason: Optional[str]


class ScheduleEnforcementStatusUpdate(BaseModel):
    """Latest schedule enforcement state reported by a student agent."""
    student_id: str = Field(..., min_length=1)
    active_domains: List[str] = Field(default_factory=list)
    applied_domains: List[str] = Field(default_factory=list)
    status: str = Field(default="ok")
    last_error: Optional[str] = None


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/blocks", response_model=List[ScheduledBlockResponse])
async def get_all_scheduled_blocks(
    active_only: bool = False,
    website: Optional[str] = None
):
    """
    Get all scheduled blocks.
    
    Query Parameters:
    - active_only: If True, only return active schedules
    - website: Filter by website/domain
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM scheduled_blocks WHERE 1=1"
            params = []
            
            if active_only:
                query += " AND is_active = 1"
            
            if website:
                query += " AND website LIKE ?"
                params.append(f"%{website}%")
            
            query += " ORDER BY created_at DESC"
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            blocks = []
            for row in rows:
                blocks.append({
                    "id": row[0],
                    "website": row[1],
                    "start_time": row[2],
                    "end_time": row[3],
                    "days_of_week": _parse_days_of_week(row[4]),
                    "reason": row[5],
                    "created_by": row[6],
                    "is_active": bool(row[7]),
                    "created_at": row[8],
                    "updated_at": row[9]
                })
            
            return blocks
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch scheduled blocks: {str(e)}"
        )


@router.get("/blocks/active-now", response_model=List[ActiveBlockInfo])
async def get_currently_active_blocks():
    """
    Get all blocks that are currently active based on current time and day.
    Used by student agents to check what websites are blocked right now.
    """
    try:
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        current_day = now.weekday()  # 0 = Monday, 6 = Sunday
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT website, start_time, end_time, days_of_week, reason
                FROM scheduled_blocks
                WHERE is_active = 1
            """)
            
            rows = cursor.fetchall()
            active_blocks = []
            
            for row in rows:
                website = row[0]
                start_time = row[1]
                end_time = row[2]
                days_of_week = _parse_days_of_week(row[3])
                reason = row[4]

                # Skip malformed rows instead of failing all schedules.
                if not _is_valid_time_value(start_time) or not _is_valid_time_value(end_time):
                    continue
                
                # Check if current day is in the schedule
                if current_day in days_of_week:
                    # Check if current time is within the block period
                    if start_time <= current_time <= end_time:
                        active_blocks.append({
                            "website": website,
                            "end_time": end_time,
                            "reason": reason
                        })
            
            return active_blocks
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check active blocks: {str(e)}"
        )


@router.get("/blocks/{block_id}", response_model=ScheduledBlockResponse)
async def get_scheduled_block(block_id: int):
    """Get a specific scheduled block by ID."""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM scheduled_blocks WHERE id = ?
            """, (block_id,))
            
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Scheduled block {block_id} not found"
                )
            
            return {
                "id": row[0],
                "website": row[1],
                "start_time": row[2],
                "end_time": row[3],
                "days_of_week": _parse_days_of_week(row[4]),
                "reason": row[5],
                "created_by": row[6],
                "is_active": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch scheduled block: {str(e)}"
        )


@router.post("/blocks", response_model=ScheduledBlockResponse, status_code=status.HTTP_201_CREATED)
async def create_scheduled_block(block: ScheduledBlockCreate):
    """
    Create a new scheduled block.
    Admin only - requires authentication.
    """
    try:
        # Validate day numbers
        for day in block.days_of_week:
            if day < 0 or day > 6:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Days of week must be between 0 (Monday) and 6 (Sunday)"
                )
        
        # Validate time range
        if block.start_time >= block.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start time must be before end time"
            )
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO scheduled_blocks 
                (website, start_time, end_time, days_of_week, reason, created_by, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
            """, (
                block.website,
                block.start_time,
                block.end_time,
                json.dumps(block.days_of_week),
                block.reason,
                block.created_by
            ))
            
            block_id = cursor.lastrowid
            conn.commit()
            
            # Fetch the created block
            cursor.execute("SELECT * FROM scheduled_blocks WHERE id = ?", (block_id,))
            row = cursor.fetchone()
            
            return {
                "id": row[0],
                "website": row[1],
                "start_time": row[2],
                "end_time": row[3],
                "days_of_week": _parse_days_of_week(row[4]),
                "reason": row[5],
                "created_by": row[6],
                "is_active": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create scheduled block: {str(e)}"
        )


@router.put("/blocks/{block_id}", response_model=ScheduledBlockResponse)
async def update_scheduled_block(block_id: int, block: ScheduledBlockUpdate):
    """
    Update an existing scheduled block.
    Admin only - requires authentication.
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if block exists
            cursor.execute("SELECT id FROM scheduled_blocks WHERE id = ?", (block_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Scheduled block {block_id} not found"
                )
            
            # Build update query dynamically
            update_fields = []
            params = []
            
            if block.website is not None:
                update_fields.append("website = ?")
                params.append(block.website)
            
            if block.start_time is not None:
                update_fields.append("start_time = ?")
                params.append(block.start_time)
            
            if block.end_time is not None:
                update_fields.append("end_time = ?")
                params.append(block.end_time)
            
            if block.days_of_week is not None:
                # Validate day numbers
                for day in block.days_of_week:
                    if day < 0 or day > 6:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Days of week must be between 0 (Monday) and 6 (Sunday)"
                        )
                update_fields.append("days_of_week = ?")
                params.append(json.dumps(block.days_of_week))
            
            if block.reason is not None:
                update_fields.append("reason = ?")
                params.append(block.reason)
            
            if block.is_active is not None:
                update_fields.append("is_active = ?")
                params.append(1 if block.is_active else 0)
            
            if not update_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            update_fields.append("updated_at = datetime('now')")
            params.append(block_id)
            
            query = f"UPDATE scheduled_blocks SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            conn.commit()
            
            # Fetch updated block
            cursor.execute("SELECT * FROM scheduled_blocks WHERE id = ?", (block_id,))
            row = cursor.fetchone()
            
            return {
                "id": row[0],
                "website": row[1],
                "start_time": row[2],
                "end_time": row[3],
                "days_of_week": _parse_days_of_week(row[4]),
                "reason": row[5],
                "created_by": row[6],
                "is_active": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update scheduled block: {str(e)}"
        )


@router.delete("/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scheduled_block(block_id: int):
    """
    Delete a scheduled block.
    Admin only - requires authentication.
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT id FROM scheduled_blocks WHERE id = ?", (block_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Scheduled block {block_id} not found"
                )
            
            cursor.execute("DELETE FROM scheduled_blocks WHERE id = ?", (block_id,))
            conn.commit()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete scheduled block: {str(e)}"
        )


@router.post("/blocks/{block_id}/toggle", response_model=ScheduledBlockResponse)
async def toggle_scheduled_block(block_id: int):
    """
    Toggle a scheduled block's active status.
    Convenience endpoint for enabling/disabling schedules.
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT is_active FROM scheduled_blocks WHERE id = ?", (block_id,))
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Scheduled block {block_id} not found"
                )
            
            new_status = 0 if row[0] else 1
            
            cursor.execute("""
                UPDATE scheduled_blocks 
                SET is_active = ?, updated_at = datetime('now')
                WHERE id = ?
            """, (new_status, block_id))
            conn.commit()
            
            # Fetch updated block
            cursor.execute("SELECT * FROM scheduled_blocks WHERE id = ?", (block_id,))
            row = cursor.fetchone()
            
            return {
                "id": row[0],
                "website": row[1],
                "start_time": row[2],
                "end_time": row[3],
                "days_of_week": _parse_days_of_week(row[4]),
                "reason": row[5],
                "created_by": row[6],
                "is_active": bool(row[7]),
                "created_at": row[8],
                "updated_at": row[9]
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle scheduled block: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for the schedule service."""
    return {
        "status": "healthy",
        "service": "schedule",
        "timestamp": datetime.now().isoformat()
    }


@router.post("/status")
async def report_schedule_status(payload: ScheduleEnforcementStatusUpdate):
    """Receive latest schedule enforcement state from a student agent."""
    try:
        db.upsert_schedule_enforcement_status(
            student_id=payload.student_id,
            active_domains=payload.active_domains,
            applied_domains=payload.applied_domains,
            status=payload.status,
            last_error=payload.last_error,
        )
        return {
            "success": True,
            "student_id": payload.student_id,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save schedule status: {str(e)}"
        )


@router.get("/status")
async def get_schedule_status(limit: int = 100):
    """Return latest schedule enforcement state for student agents."""
    try:
        return {
            "success": True,
            "data": db.get_schedule_enforcement_statuses(limit=limit)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch schedule status: {str(e)}"
        )
