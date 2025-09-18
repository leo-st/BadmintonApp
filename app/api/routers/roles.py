from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.core.authorize import authorize
from app.models.models import User
from app.services.user_service import (
    get_all_roles, create_new_role, get_role_with_id, 
    put_role_with_id, delete_role_with_id
)
from app.schemas.schemas import RoleCreate, RoleUpdate

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get(
    "/",
    name="List roles",
    description="Return a list of all roles.",
    response_model=list[dict],
)
def get_roles(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["roles_can_view_role_list"])
    try:
        return get_all_roles(db=db)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch roles at this time."
        )


@router.post(
    "/",
    name="Create role",
    description="Create a new role.",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def create_role(
    roleCreate: RoleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["roles_can_create_edit_role"])
    try:
        return create_new_role(role_create=roleCreate, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create role at this time."
        )


@router.get(
    "/{role_id}",
    name="Get role by ID",
    description="Fetch a single role by its ID.",
    response_model=dict,
)
def get_role_by_id(
    role_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["roles_can_view_role_list"])
    try:
        return get_role_with_id(role_id=role_id, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch role at this time."
        )


@router.put(
    "/{role_id}",
    name="Update role",
    description="Update an existing role by ID.",
    response_model=dict,
)
def put_role_by_id(
    role_id: int,
    roleUpdate: RoleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["roles_can_create_edit_role"])
    try:
        return put_role_with_id(role_id=role_id, role_update=roleUpdate, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update role at this time."
        )


@router.delete(
    "/{role_id}",
    name="Delete role",
    description="Delete a role by its ID.",
    response_model=dict,
)
def delete_role_by_id(
    role_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["roles_can_create_edit_role"])
    try:
        return delete_role_with_id(role_id=role_id, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete role at this time."
        )

