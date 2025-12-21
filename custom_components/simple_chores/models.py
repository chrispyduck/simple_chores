"""Pydantic models for simple_chores configuration."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, field_validator

from .const import sanitize_entity_id


class ChoreFrequency(str, Enum):
    """Frequency for chores."""

    DAILY = "daily"
    MANUAL = "manual"


class ChoreState(str, Enum):
    """State of a chore."""

    PENDING = "Pending"
    COMPLETE = "Complete"
    NOT_REQUESTED = "Not Requested"


class ChoreConfig(BaseModel):
    """Configuration for a single chore."""

    name: str = Field(..., description="Display name of the chore")
    slug: str = Field(..., description="Unique identifier for the chore")
    description: str = Field(default="", description="Description of the chore")
    frequency: ChoreFrequency = Field(
        ..., description="How often the chore should be done"
    )
    assignees: list[str] = Field(
        default_factory=list, description="List of assignee usernames"
    )
    icon: str = Field(
        default="mdi:clipboard-list-outline",
        description="Material Design Icon for the chore",
    )

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate and sanitize slug format."""
        if not v:
            msg = "Slug cannot be empty"
            raise ValueError(msg)
        # Sanitize: convert to lowercase, hyphens to underscores, remove invalid chars
        sanitized = sanitize_entity_id(v)
        if not sanitized:
            msg = f"Slug '{v}' must contain at least one alphanumeric character"
            raise ValueError(msg)
        return sanitized

    @field_validator("assignees")
    @classmethod
    def validate_assignees(cls, v: list[str]) -> list[str]:
        """Validate assignees list."""
        if not v:
            msg = "At least one assignee is required"
            raise ValueError(msg)
        return v

    model_config = {"frozen": False, "extra": "forbid"}


class SimpleChoresConfig(BaseModel):
    """Root configuration for simple_chores integration."""

    chores: list[ChoreConfig] = Field(
        default_factory=list, description="List of chores"
    )

    @field_validator("chores")
    @classmethod
    def validate_unique_slugs(cls, v: list[ChoreConfig]) -> list[ChoreConfig]:
        """Ensure all chore slugs are unique."""
        slugs = [chore.slug for chore in v]
        if len(slugs) != len(set(slugs)):
            duplicates = {slug for slug in slugs if slugs.count(slug) > 1}
            msg = f"Duplicate chore slugs found: {duplicates}"
            raise ValueError(msg)
        return v

    def get_chore_by_slug(self, slug: str) -> ChoreConfig | None:
        """Get a chore by its slug."""
        for chore in self.chores:
            if chore.slug == slug:
                return chore
        return None

    def get_chores_for_assignee(self, assignee: str) -> list[ChoreConfig]:
        """Get all chores assigned to a specific user."""
        return [chore for chore in self.chores if assignee in chore.assignees]

    model_config = {"frozen": False, "extra": "forbid"}
