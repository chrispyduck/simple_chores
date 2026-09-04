"""Tests for simple_chores models."""

import pytest
from pydantic import ValidationError

from custom_components.simple_chores.models import (
    CategoryConfig,
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    PrivilegeBehavior,
    PrivilegeConfig,
    PrivilegeState,
    SimpleChoresConfig,
)


class TestChoreFrequency:
    """Tests for ChoreFrequency enum."""

    def test_frequency_values(self) -> None:
        """Test that frequency enum has expected values."""
        assert ChoreFrequency.DAILY.value == "daily"
        assert ChoreFrequency.MANUAL.value == "manual"


class TestChoreState:
    """Tests for ChoreState enum."""

    def test_state_values(self) -> None:
        """Test that state enum has expected values."""
        assert ChoreState.PENDING.value == "Pending"
        assert ChoreState.COMPLETE.value == "Complete"
        assert ChoreState.NOT_REQUESTED.value == "Not Requested"


class TestChoreConfig:
    """Tests for ChoreConfig model."""

    def test_valid_chore_config(self) -> None:
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

    def test_chore_config_minimal(self) -> None:
        """Test creating a chore with minimal required fields."""
        chore = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        assert chore.name == "Vacuum"
        assert chore.slug == "vacuum"
        assert chore.description == ""  # default value
        assert chore.frequency == ChoreFrequency.DAILY
        assert chore.assignees == ["alice"]

    def test_slug_validation_empty(self) -> None:
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

    def test_slug_sanitization_invalid_characters(self) -> None:
        """Test that slug with invalid characters is sanitized."""
        chore = ChoreConfig(
            name="Test",
            slug="invalid slug!",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        # Spaces and special characters should be stripped
        assert chore.slug == "invalidslug"

    def test_slug_normalized_to_lowercase(self) -> None:
        """Test that slug is normalized to lowercase."""
        chore = ChoreConfig(
            name="Test",
            slug="MyChore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        assert chore.slug == "mychore"

    def test_slug_converts_hyphens_to_underscores(self) -> None:
        """Test that slug converts hyphens to underscores."""
        chore = ChoreConfig(
            name="Test",
            slug="my-chore_name",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        # Hyphens should be converted to underscores
        assert chore.slug == "my_chore_name"

    def test_assignees_validation_empty(self) -> None:
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

    def test_chore_config_forbids_extra_fields(self) -> None:
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

    def test_category_defaults_to_none(self) -> None:
        """Test that a chore with no category defaults to uncategorized."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        assert chore.category is None

    def test_category_empty_string_normalizes_to_none(self) -> None:
        """Test that an empty-string category normalizes to None (uncategorized)."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            category="",
        )

        assert chore.category is None

    def test_category_sanitized_like_a_slug(self) -> None:
        """Test that the category reference is sanitized the same as a slug."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            category="Kitchen-Chores!",
        )

        assert chore.category == "kitchen_chores"


class TestCategoryConfig:
    """Tests for CategoryConfig model."""

    def test_valid_category_config(self) -> None:
        """Test creating a valid category configuration."""
        category = CategoryConfig(name="Kitchen", slug="kitchen", icon="mdi:chef-hat")

        assert category.name == "Kitchen"
        assert category.slug == "kitchen"
        assert category.icon == "mdi:chef-hat"

    def test_category_config_minimal(self) -> None:
        """Test creating a category with minimal required fields."""
        category = CategoryConfig(name="Outdoor", slug="outdoor")

        assert category.name == "Outdoor"
        assert category.slug == "outdoor"
        assert category.icon == "mdi:tag-outline"  # default value

    def test_category_slug_validation_empty(self) -> None:
        """Test that empty slug raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            CategoryConfig(name="Test", slug="")

        errors = exc_info.value.errors()
        assert any("Slug cannot be empty" in str(err) for err in errors)

    def test_category_slug_sanitization(self) -> None:
        """Test that the category slug is sanitized like a chore slug."""
        category = CategoryConfig(name="Test", slug="My Category!")

        assert category.slug == "mycategory"

    def test_category_config_forbids_extra_fields(self) -> None:
        """Test that extra fields are forbidden."""
        with pytest.raises(ValidationError) as exc_info:
            CategoryConfig(name="Test", slug="test", extra_field="not allowed")

        errors = exc_info.value.errors()
        assert any("extra_field" in str(err) for err in errors)


class TestSimpleChoresConfigWithCategories:
    """Tests for SimpleChoresConfig with categories."""

    def test_config_with_categories(self) -> None:
        """Test creating a configuration with categories."""
        category = CategoryConfig(name="Kitchen", slug="kitchen")
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            category="kitchen",
        )

        config = SimpleChoresConfig(chores=[chore], categories=[category])
        assert len(config.categories) == 1
        assert config.categories[0].slug == "kitchen"
        assert config.chores[0].category == "kitchen"

    def test_duplicate_category_slugs_validation(self) -> None:
        """Test that duplicate category slugs raise validation error."""
        category1 = CategoryConfig(name="Kitchen 1", slug="kitchen")
        category2 = CategoryConfig(name="Kitchen 2", slug="kitchen")

        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(chores=[], categories=[category1, category2])

        errors = exc_info.value.errors()
        assert any("Duplicate category slugs" in str(err) for err in errors)

    def test_chore_category_must_reference_existing_category(self) -> None:
        """Test that a chore's category must reference an existing category."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            category="nonexistent_category",
        )

        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(chores=[chore], categories=[])

        errors = exc_info.value.errors()
        assert any("non-existent" in str(err) for err in errors)
        assert any("category" in str(err) for err in errors)

    def test_get_category_by_slug_found(self) -> None:
        """Test getting a category by slug when it exists."""
        category = CategoryConfig(name="Kitchen", slug="kitchen")
        config = SimpleChoresConfig(chores=[], categories=[category])

        found_category = config.get_category_by_slug("kitchen")

        assert found_category is not None
        assert found_category.name == "Kitchen"

    def test_get_category_by_slug_not_found(self) -> None:
        """Test getting a category by slug when it doesn't exist."""
        config = SimpleChoresConfig(chores=[], categories=[])

        assert config.get_category_by_slug("nonexistent") is None

    def test_get_chores_for_category(self) -> None:
        """Test getting all chores assigned to a category."""
        category = CategoryConfig(name="Kitchen", slug="kitchen")
        chore1 = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            category="kitchen",
        )
        chore2 = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.DAILY,
            assignees=["bob"],
        )

        config = SimpleChoresConfig(chores=[chore1, chore2], categories=[category])
        kitchen_chores = config.get_chores_for_category("kitchen")

        assert len(kitchen_chores) == 1
        assert kitchen_chores[0].slug == "dishes"

    def test_default_empty_categories_list(self) -> None:
        """Test that categories list defaults to empty."""
        config = SimpleChoresConfig()
        assert config.categories == []


class TestSimpleChoresConfig:
    """Tests for SimpleChoresConfig model."""

    def test_empty_config(self) -> None:
        """Test creating an empty configuration."""
        config = SimpleChoresConfig(chores=[])
        assert config.chores == []

    def test_config_with_chores(self) -> None:
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
            frequency=ChoreFrequency.DAILY,
            assignees=["bob"],
        )

        config = SimpleChoresConfig(chores=[chore1, chore2])
        assert len(config.chores) == 2
        assert config.chores[0].slug == "dishes"
        assert config.chores[1].slug == "vacuum"

    def test_duplicate_slugs_validation(self) -> None:
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
            frequency=ChoreFrequency.DAILY,
            assignees=["bob"],
        )

        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(chores=[chore1, chore2])

        errors = exc_info.value.errors()
        assert any("Duplicate chore slugs" in str(err) for err in errors)
        assert any("dishes" in str(err) for err in errors)

    def test_get_chore_by_slug_found(self) -> None:
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
            frequency=ChoreFrequency.DAILY,
            assignees=["bob"],
        )

        config = SimpleChoresConfig(chores=[chore1, chore2])
        found_chore = config.get_chore_by_slug("vacuum")

        assert found_chore is not None
        assert found_chore.name == "Vacuum"
        assert found_chore.slug == "vacuum"

    def test_get_chore_by_slug_not_found(self) -> None:
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

    def test_get_chores_for_assignee_found(self) -> None:
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
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        chore3 = ChoreConfig(
            name="Laundry",
            slug="laundry",
            frequency=ChoreFrequency.DAILY,
            assignees=["bob"],
        )

        config = SimpleChoresConfig(chores=[chore1, chore2, chore3])
        alice_chores = config.get_chores_for_assignee("alice")

        assert len(alice_chores) == 2
        assert "dishes" in [c.slug for c in alice_chores]
        assert "vacuum" in [c.slug for c in alice_chores]

    def test_get_chores_for_assignee_none_found(self) -> None:
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

    def test_config_forbids_extra_fields(self) -> None:
        """Test that extra fields are forbidden in config."""
        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(chores=[], extra_field="not allowed")

        errors = exc_info.value.errors()
        assert any("extra_field" in str(err) for err in errors)

    def test_default_empty_chores_list(self) -> None:
        """Test that chores list defaults to empty."""
        config = SimpleChoresConfig()
        assert config.chores == []


class TestPrivilegeBehavior:
    """Tests for PrivilegeBehavior enum."""

    def test_behavior_values(self) -> None:
        """Test that behavior enum has expected values."""
        assert PrivilegeBehavior.AUTOMATIC.value == "automatic"
        assert PrivilegeBehavior.MANUAL.value == "manual"


class TestPrivilegeState:
    """Tests for PrivilegeState enum."""

    def test_state_values(self) -> None:
        """Test that state enum has expected values."""
        assert PrivilegeState.ENABLED.value == "Enabled"
        assert PrivilegeState.DISABLED.value == "Disabled"
        assert PrivilegeState.TEMPORARILY_DISABLED.value == "Temporarily Disabled"


class TestPrivilegeConfig:
    """Tests for PrivilegeConfig model."""

    def test_valid_privilege_config(self) -> None:
        """Test creating a valid privilege configuration."""
        privilege = PrivilegeConfig(
            name="Screen Time",
            slug="screen_time",
            icon="mdi:television",
            behavior=PrivilegeBehavior.AUTOMATIC,
            linked_chores=["dishes"],
            assignees=["alice", "bob"],
        )

        assert privilege.name == "Screen Time"
        assert privilege.slug == "screen_time"
        assert privilege.icon == "mdi:television"
        assert privilege.behavior == PrivilegeBehavior.AUTOMATIC
        assert privilege.linked_chores == ["dishes"]
        assert privilege.assignees == ["alice", "bob"]

    def test_privilege_config_minimal(self) -> None:
        """Test creating a privilege with minimal required fields."""
        privilege = PrivilegeConfig(
            name="Gaming",
            slug="gaming",
            assignees=["alice"],
        )

        assert privilege.name == "Gaming"
        assert privilege.slug == "gaming"
        assert privilege.icon == "mdi:star"  # default value
        assert privilege.behavior == PrivilegeBehavior.AUTOMATIC  # default value
        assert privilege.linked_chores == []  # default value
        assert privilege.assignees == ["alice"]

    def test_privilege_slug_validation_empty(self) -> None:
        """Test that empty slug raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            PrivilegeConfig(
                name="Test",
                slug="",
                assignees=["alice"],
            )

        errors = exc_info.value.errors()
        assert any("Slug cannot be empty" in str(err) for err in errors)

    def test_privilege_assignees_validation_empty(self) -> None:
        """Test that empty assignees list raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            PrivilegeConfig(
                name="Test",
                slug="test",
                assignees=[],
            )

        errors = exc_info.value.errors()
        assert any("At least one assignee is required" in str(err) for err in errors)


class TestSimpleChoresConfigWithPrivileges:
    """Tests for SimpleChoresConfig with privileges."""

    def test_config_with_privileges(self) -> None:
        """Test creating a configuration with privileges."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        privilege = PrivilegeConfig(
            name="Screen Time",
            slug="screen_time",
            linked_chores=["dishes"],
            assignees=["alice"],
        )

        config = SimpleChoresConfig(chores=[chore], privileges=[privilege])
        assert len(config.privileges) == 1
        assert config.privileges[0].slug == "screen_time"

    def test_duplicate_privilege_slugs_validation(self) -> None:
        """Test that duplicate privilege slugs raise validation error."""
        privilege1 = PrivilegeConfig(
            name="Screen Time 1",
            slug="screen_time",
            assignees=["alice"],
        )
        privilege2 = PrivilegeConfig(
            name="Screen Time 2",
            slug="screen_time",
            assignees=["bob"],
        )

        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(chores=[], privileges=[privilege1, privilege2])

        errors = exc_info.value.errors()
        assert any("Duplicate privilege slugs" in str(err) for err in errors)

    def test_linked_chores_validation(self) -> None:
        """Test that linked_chores must reference existing chores."""
        privilege = PrivilegeConfig(
            name="Screen Time",
            slug="screen_time",
            linked_chores=["nonexistent_chore"],
            assignees=["alice"],
        )

        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(chores=[], privileges=[privilege])

        errors = exc_info.value.errors()
        assert any("non-existent chore" in str(err) for err in errors)

    def test_get_privilege_by_slug_found(self) -> None:
        """Test getting a privilege by slug when it exists."""
        privilege = PrivilegeConfig(
            name="Screen Time",
            slug="screen_time",
            assignees=["alice"],
        )

        config = SimpleChoresConfig(chores=[], privileges=[privilege])
        found_privilege = config.get_privilege_by_slug("screen_time")

        assert found_privilege is not None
        assert found_privilege.name == "Screen Time"

    def test_get_privilege_by_slug_not_found(self) -> None:
        """Test getting a privilege by slug when it doesn't exist."""
        config = SimpleChoresConfig(chores=[], privileges=[])
        found_privilege = config.get_privilege_by_slug("nonexistent")

        assert found_privilege is None

    def test_get_privileges_for_assignee(self) -> None:
        """Test getting privileges for an assignee."""
        privilege1 = PrivilegeConfig(
            name="Screen Time",
            slug="screen_time",
            assignees=["alice", "bob"],
        )
        privilege2 = PrivilegeConfig(
            name="Gaming",
            slug="gaming",
            assignees=["alice"],
        )
        privilege3 = PrivilegeConfig(
            name="Other",
            slug="other",
            assignees=["bob"],
        )

        config = SimpleChoresConfig(
            chores=[], privileges=[privilege1, privilege2, privilege3]
        )
        alice_privileges = config.get_privileges_for_assignee("alice")

        assert len(alice_privileges) == 2
        assert "screen_time" in [p.slug for p in alice_privileges]
        assert "gaming" in [p.slug for p in alice_privileges]

    def test_default_empty_privileges_list(self) -> None:
        """Test that privileges list defaults to empty."""
        config = SimpleChoresConfig()
        assert config.privileges == []
