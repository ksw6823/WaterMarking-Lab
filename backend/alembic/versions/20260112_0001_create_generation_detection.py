"""create generation & detection tables

Revision ID: 20260112_0001
Revises: 
Create Date: 2026-01-12
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260112_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "generations",
        sa.Column("generation_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("original_id", sa.Integer(), sa.ForeignKey("generations.generation_id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("output_text", sa.Text(), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("quantization", sa.String(length=32), nullable=True),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("top_k", sa.Integer(), nullable=True),
        sa.Column("top_p", sa.Float(), nullable=True),
        sa.Column("max_tokens", sa.Integer(), nullable=True),
        sa.Column("watermark_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("context_width", sa.Integer(), nullable=True),
        sa.Column("tournament_size", sa.Integer(), nullable=True),
        sa.Column("g_value", sa.Float(), nullable=True),
        sa.Column("watermark_key", sa.String(length=256), nullable=True),
        sa.Column("attack_type", sa.String(length=32), nullable=True),
        sa.Column("attack_intensity", sa.Float(), nullable=True),
    )
    op.create_index("ix_generations_original_id", "generations", ["original_id"])
    op.create_index("ix_generations_model", "generations", ["model"])
    op.create_index("ix_generations_watermark_enabled", "generations", ["watermark_enabled"])
    op.create_index("ix_generations_attack_type", "generations", ["attack_type"])
    op.create_index("ix_generations_created_at_generation_id", "generations", ["created_at", "generation_id"])

    op.create_table(
        "detections",
        sa.Column("detection_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("generation_id", sa.Integer(), sa.ForeignKey("generations.generation_id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("is_watermarked", sa.Boolean(), nullable=False),
        sa.Column("z_score", sa.Float(), nullable=True),
        sa.Column("p_value", sa.Float(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("true_positive_rate", sa.Float(), nullable=True),
        sa.Column("false_positive_rate", sa.Float(), nullable=True),
        sa.Column("roc_auc", sa.Float(), nullable=True),
        sa.Column("bleu_score", sa.Float(), nullable=True),
    )
    op.create_index("ix_detections_generation_id", "detections", ["generation_id"])
    op.create_index("ix_detections_is_watermarked", "detections", ["is_watermarked"])
    op.create_index("ix_detections_confidence", "detections", ["confidence"])
    op.create_index("ix_detections_created_at_detection_id", "detections", ["created_at", "detection_id"])


def downgrade() -> None:
    op.drop_index("ix_detections_created_at_detection_id", table_name="detections")
    op.drop_index("ix_detections_confidence", table_name="detections")
    op.drop_index("ix_detections_is_watermarked", table_name="detections")
    op.drop_index("ix_detections_generation_id", table_name="detections")
    op.drop_table("detections")

    op.drop_index("ix_generations_created_at_generation_id", table_name="generations")
    op.drop_index("ix_generations_attack_type", table_name="generations")
    op.drop_index("ix_generations_watermark_enabled", table_name="generations")
    op.drop_index("ix_generations_model", table_name="generations")
    op.drop_index("ix_generations_original_id", table_name="generations")
    op.drop_table("generations")

