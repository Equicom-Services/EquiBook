from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Boolean,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Site(Base):
    __tablename__ = "sites"

    site_id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    site_name = Column(
        String(50),
        nullable=False,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    rooms = relationship(
        "Room",
        back_populates="site",
    )