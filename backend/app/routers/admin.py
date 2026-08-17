from fastapi import APIRouter, Depends

from app.core.security import get_current_admin

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/me")
def get_current_admin_info(
    current_admin=Depends(get_current_admin),
):
    return {
        "id": current_admin.id,
        "email": current_admin.email,
        "name": current_admin.name,
        "site" : current_admin.site
    }