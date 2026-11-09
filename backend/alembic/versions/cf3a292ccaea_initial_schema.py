"""initial schema

Revision ID: cf3a292ccaea
Revises: 
Create Date: 2026-11-09 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf3a292ccaea'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to create core tables."""
    # users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('CURRENT_TIMESTAMP'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # subjects table
    op.create_table(
        'subjects',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_subjects_user_id'), 'subjects', ['user_id'], unique=False)

    # items table
    op.create_table(
        'items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('url', sa.String(length=500), nullable=True),
        sa.Column('difficulty', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_items_subject_id'), 'items', ['subject_id'], unique=False)

    # tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('subject_id', 'name', name='uq_subject_tag_name'),
    )
    op.create_index(op.f('ix_tags_subject_id'), 'tags', ['subject_id'], unique=False)

    # item_tags association table
    op.create_table(
        'item_tags',
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('item_id', 'tag_id'),
    )

    # user_items table
    op.create_table(
        'user_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('ease_factor', sa.Float(), server_default='2.5', nullable=False),
        sa.Column('interval_days', sa.Integer(), server_default='0', nullable=False),
        sa.Column('repetitions', sa.Integer(), server_default='0', nullable=False),
        sa.Column('next_review_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'item_id', name='uq_user_item'),
    )
    op.create_index(op.f('ix_user_items_item_id'), 'user_items', ['item_id'], unique=False)
    op.create_index(op.f('ix_user_items_next_review_date'), 'user_items', ['next_review_date'], unique=False)
    op.create_index(op.f('ix_user_items_user_id'), 'user_items', ['user_id'], unique=False)

    # review_logs table
    op.create_table(
        'review_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_item_id', sa.Integer(), nullable=False),
        sa.Column('rating', sa.String(length=20), nullable=False),
        sa.Column('time_taken_seconds', sa.Integer(), server_default='0', nullable=False),
        sa.Column(
            'reviewed_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('CURRENT_TIMESTAMP'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_item_id'], ['user_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_review_logs_reviewed_at'), 'review_logs', ['reviewed_at'], unique=False)
    op.create_index(op.f('ix_review_logs_user_item_id'), 'review_logs', ['user_item_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema by dropping all tables in reverse order."""
    op.drop_table('review_logs')
    op.drop_table('user_items')
    op.drop_table('item_tags')
    op.drop_table('tags')
    op.drop_table('items')
    op.drop_table('subjects')
    op.drop_table('users')
