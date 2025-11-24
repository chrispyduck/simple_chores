"""Tests for simple_chores models."""

import pytest
from pydantic import ValidationError

from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    SimpleChoresConfig,
)


class TestChoreFrequency:
    """Tests for ChoreFrequency enum."""

    def test_frequency_values(self):
        """Test that frequency enum has expected values."""
        assert ChoreFrequency.DAILY.value == "daily"
        assert ChoreFrequency.WEEKLY.value == "weekly"
        assert ChoreFrequency.MANUAL.value == "manual"


class TestChoreState:
    """Tests for ChoreState enum."""

    def test_state_values(self):
        """Test that state enum has expected values."""
        assert ChoreState.PENDING.value == "Pending"
        assert ChoreState.COMPLETE.value == "Complete"
        assert ChoreState.NOT_REQUESTED.value == "Not Requested"


class TestChoreConfig:
    """Tests for ChoreConfig model."""

    def test_valid_chore_config(self):
        """Test creating a valid chore configuration."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            description="Do the dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        assert chore.name == "Dishes"
        assert chore.slug == "dishes"
        assert chore.description == "Do the dishes"
        assert chore.frequency == ChoreFrequency.DAILY
        assert chore.assignees == ["alice", "bob"]

    def test_chore_config_minimal(self):
        """Test creating a chore with minimal required fields."""
        chore = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["alice"],
        )

        assert chore.name == "Vacuum"
        assert chore.slug == "vacuum"
        assert chore.description == ""  # default value
        assert chore.frequency == ChoreFrequency.WEEKLY
        assert chore.assignees == ["alice"]

    def test_slug_validation_empty(self):
        """Test that empty slug raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ChoreConfig(
                name="Test",
                slug="",
                frequency=ChoreFrequency.DAILY,
                assignees=["alice"],
            )

        errors = exc_info.value.errors()
        assert any("Slug cannot be empty" in str(err) for err in errors)

    def test_slug_validation_invalid_characters(self):
        """Test that slug with invalid characters raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ChoreConfig(
                name="Test",
                slug="invalid slug!",
                frequency=ChoreFrequency.DAILY,
                assignees=["alice"],
            )

        errors = exc_info.value.errors()
        assert any("must contain only alphanumeric" in str(err) for err in errors)

    def test_slug_normalized_to_lowercase(self):
        """Test that slug is normalized to lowercase."""
        chore = ChoreConfig(
            name="Test",
            slug="MyChore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        assert chore.slug == "mychore"

    def test_slug_allows_hyphens_and_underscores(self):
        """Test that slug allows hyphens and underscores."""
        chore = ChoreConfig(
            name="Test",
            slug="my-chore_name",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        assert chore.slug == "my-chore_name"

    def test_assignees_validation_empty(self):
        """Test that empty assignees list raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ChoreConfig(
                name="Test",
                slug="test",
                frequency=ChoreFrequency.DAILY,
                assignees=[],
            )

        errors = exc_info.value.errors()
        assert any("At least one assignee is required" in str(err) for err in errors)

    def test_chore_config_forbids_extra_fields(self):
        """Test that extra fields are forbidden."""
        with pytest.raises(ValidationError) as exc_info:
            ChoreConfig(
                name="Test",
                slug="test",
                frequency=ChoreFrequency.DAILY,
                assignees=["alice"],
                extra_field="not allowed",
            )

        errors = exc_info.value.errors()
        assert any("extra_field" in str(err) for err in errors)


class TestSimpleChoresConfig:
    """Tests for SimpleChoresConfig model."""

    def test_empty_config(self):
        """Test creating an empty configuration."""
        config = SimpleChoresConfig(chores=[])
        assert config.chores == []

    def test_config_with_chores(self):
        """Test creating a configuration with chores."""
        chore1 = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        chore2 = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["bob"],
        )

        config = SimpleChoresConfig(chores=[chore1, chore2])
        assert len(config.chores) == 2
        assert config.chores[0].slug == "dishes"
        assert config.chores[1].slug == "vacuum"

    def test_duplicate_slugs_validation(self):
        """Test that duplicate slugs raise validation error."""
        chore1 = ChoreConfig(
            name="Dishes 1",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        chore2 = ChoreConfig(
            name="Dishes 2",
            slug="dishes",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["bob"],
        )

        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(chores=[chore1, chore2])

        errors = exc_info.value.errors()
        assert any("Duplicate chore slugs" in str(err) for err in errors)
        assert any("dishes" in str(err) for err in errors)

    def test_get_chore_by_slug_found(self):
        """Test getting a chore by slug when it exists."""
        chore1 = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        chore2 = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["bob"],
        )

        config = SimpleChoresConfig(chores=[chore1, chore2])
        found_chore = config.get_chore_by_slug("vacuum")

        assert found_chore is not None
        assert found_chore.name == "Vacuum"
        assert found_chore.slug == "vacuum"

    def test_get_chore_by_slug_not_found(self):
        """Test getting a chore by slug when it doesn't exist."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        config = SimpleChoresConfig(chores=[chore])
        found_chore = config.get_chore_by_slug("vacuum")

        assert found_chore is None

    def test_get_chores_for_assignee_found(self):
        """Test getting chores for an assignee."""
        chore1 = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )
        chore2 = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["alice"],
        )
        chore3 = ChoreConfig(
            name="Laundry",
            slug="laundry",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["bob"],
        )

        config = SimpleChoresConfig(chores=[chore1, chore2, chore3])
        alice_chores = config.get_chores_for_assignee("alice")

        assert len(alice_chores) == 2
        assert "dishes" in [c.slug for c in alice_chores]
        assert "vacuum" in [c.slug for c in alice_chores]

    def test_get_chores_for_assignee_none_found(self):
        """Test getting chores for an assignee with no chores."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        config = SimpleChoresConfig(chores=[chore])
        bob_chores = config.get_chores_for_assignee("bob")

        assert bob_chores == []

    def test_config_forbids_extra_fields(self):
        """Test that extra fields are forbidden in config."""
        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(chores=[], extra_field="not allowed")

        errors = exc_info.value.errors()
        assert any("extra_field" in str(err) for err in errors)

    def test_default_empty_chores_list(self):
        """Test that chores list defaults to empty."""
        config = SimpleChoresConfig()
        assert config.chores == []
