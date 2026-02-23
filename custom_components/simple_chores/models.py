"""Pydantic models for simple_chores configuration."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator

from .const import sanitize_entity_id


class ChoreFrequency(str, Enum):
    """Frequency for chores."""

    DAILY = "daily"
    MANUAL = "manual"
    ONCE = "once"


class ChoreState(str, Enum):
    """State of a chore."""

    PENDING = "Pending"
    COMPLETE = "Complete"
    NOT_REQUESTED = "Not Requested"


class PrivilegeBehavior(str, Enum):
    """Behavior mode for privileges."""

    AUTOMATIC = "automatic"
    MANUAL = "manual"


class PrivilegeState(str, Enum):
    """State of a privilege."""

    ENABLED = "Enabled"
    DISABLED = "Disabled"
    TEMPORARILY_DISABLED = "Temporarily Disabled"


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
    points: int = Field(
        default=1,
        description="Points awarded when chore is completed",
        ge=0,
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


class PrivilegeConfig(BaseModel):
    """Configuration for a single privilege."""

    name: str = Field(..., description="Display name of the privilege")
    slug: str = Field(..., description="Unique identifier for the privilege")
    icon: str = Field(
        default="mdi:star",
        description="Material Design Icon for the privilege",
    )
    behavior: PrivilegeBehavior = Field(
        default=PrivilegeBehavior.AUTOMATIC,
        description="How the privilege state is managed",
    )
    linked_chores: list[str] = Field(
        default_factory=list,
        description="List of chore slugs that grant this privilege when complete",
    )
    assignees: list[str] = Field(
        default_factory=list, description="List of assignee usernames"
    )

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate and sanitize slug format."""
        if not v:
            msg = "Slug cannot be empty"
            raise ValueError(msg)
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
    privileges: list[PrivilegeConfig] = Field(
        default_factory=list, description="List of privileges"
    )

    @field_validator("chores")
    @classmethod
    def validate_unique_chore_slugs(cls, v: list[ChoreConfig]) -> list[ChoreConfig]:
        """Ensure all chore slugs are unique."""
        slugs = [chore.slug for chore in v]
        if len(slugs) != len(set(slugs)):
            duplicates = {slug for slug in slugs if slugs.count(slug) > 1}
            msg = f"Duplicate chore slugs found: {duplicates}"
            raise ValueError(msg)
        return v

    @field_validator("privileges")
    @classmethod
    def validate_unique_privilege_slugs(
        cls, v: list[PrivilegeConfig]
    ) -> list[PrivilegeConfig]:
        """Ensure all privilege slugs are unique."""
        slugs = [privilege.slug for privilege in v]
        if len(slugs) != len(set(slugs)):
            duplicates = {slug for slug in slugs if slugs.count(slug) > 1}
            msg = f"Duplicate privilege slugs found: {duplicates}"
            raise ValueError(msg)
        return v

    @model_validator(mode="after")
    def validate_linked_chores_exist(self) -> SimpleChoresConfig:
        """Validate that all linked_chores in privileges reference existing chores."""
        chore_slugs = {chore.slug for chore in self.chores}
        for privilege in self.privileges:
            for linked_chore in privilege.linked_chores:
                if linked_chore not in chore_slugs:
                    msg = (
                        f"Privilege '{privilege.slug}' references non-existent "
                        f"chore '{linked_chore}'"
                    )
                    raise ValueError(msg)
        return self

    def get_chore_by_slug(self, slug: str) -> ChoreConfig | None:
        """Get a chore by its slug."""
        for chore in self.chores:
            if chore.slug == slug:
                return chore
        return None

    def get_chores_for_assignee(self, assignee: str) -> list[ChoreConfig]:
        """Get all chores assigned to a specific user."""
        return [chore for chore in self.chores if assignee in chore.assignees]

    def get_privilege_by_slug(self, slug: str) -> PrivilegeConfig | None:
        """Get a privilege by its slug."""
        for privilege in self.privileges:
            if privilege.slug == slug:
                return privilege
        return None

    def get_privileges_for_assignee(self, assignee: str) -> list[PrivilegeConfig]:
        """Get all privileges assigned to a specific user."""
        return [
            privilege
            for privilege in self.privileges
            if assignee in privilege.assignees
        ]

    model_config = {"frozen": False, "extra": "forbid"}
