from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.site import Site

router = APIRouter(
    prefix="/sites",
    tags=["Sites"],
)


@router.get("")
def get_sites(
    db: Session = Depends(get_db),
):
    sites = (
        db.query(Site)
        .filter(Site.is_active == True)
        .order_by(Site.site_name)
        .all()
    )

    return [
        {
            "site_id": site.site_id,
            "site_name": site.site_name,
        }
        for site in sites
    ]