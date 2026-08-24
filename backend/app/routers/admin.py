from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.core.database import get_db
from app.models.site import Site

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/me")
def get_current_admin_info(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    site = (
        db.query(Site)
        .filter(
            Site.site_name == current_admin.site
        )
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Admin site not found.",
        )

    return {
        "admin_id": current_admin.id,
        "email": current_admin.email,
        "name": current_admin.name,
        "site_id": site.site_id,
        "site_name": site.site_name,
    }