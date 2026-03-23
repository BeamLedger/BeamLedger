from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    memberships = relationship("Membership", back_populates="organization")
    sites = relationship("Site", back_populates="organization", cascade="all, delete-orphan")
    rules = relationship("Rule", back_populates="organization", cascade="all, delete-orphan")