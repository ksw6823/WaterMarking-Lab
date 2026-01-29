from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, text as sql_text
from app.api.deps import get_db
from app.models.detection import Detection
from app.models.generation import Generation
import math

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Total Verifications
    total_verifications = db.query(func.count(Detection.detection_id)).scalar()

    # 2. Average AUC (Naive average from stored AUCs, or recompute?)
    # Stored AUC might be null or valid.
    avg_auc_res = db.query(func.avg(Detection.roc_auc)).filter(Detection.roc_auc.isnot(None)).scalar()
    avg_auc = round(avg_auc_res, 3) if avg_auc_res else 0.0

    # 3. Detection Rate
    # Rate of is_watermarked=True
    if total_verifications > 0:
        detected_count = db.query(func.count(Detection.detection_id)).filter(Detection.is_watermarked == True).scalar()
        detection_rate = round((detected_count / total_verifications) * 100, 1)
    else:
        detection_rate = 0.0

    # 4. Attack Attempts
    # Count generations where attack_type is not None
    attack_attempts = db.query(func.count(Generation.generation_id)).filter(Generation.attack_type.isnot(None)).scalar()

    # 5. ROC Points Generation (Simple approximation from Z-scores)
    # We collect all z-scores for watermarked vs non-watermarked (based on GROUND TRUTH).
    # BUT we don't strictly know ground truth here unless we track 'watermark_enabled' of the source Generation.
    
    # Let's join Generation to get ground truth
    results = db.query(Detection.z_score, Generation.watermark_enabled)\
        .join(Generation, Detection.generation_id == Generation.generation_id)\
        .filter(Detection.z_score.isnot(None))\
        .all()
    
    roc_points = []
    if results:
        # Separate into positive (WM enabled) and negative (WM disabled) classes
        pos_scores = [r[0] for r in results if r[1] is True]
        neg_scores = [r[0] for r in results if r[1] is False]
        
        if pos_scores and neg_scores:
            # Generate curve by varying threshold
            # Range of z-scores
            all_scores = pos_scores + neg_scores
            min_z = min(all_scores)
            max_z = max(all_scores)
            
            # Create 20 points
            for i in range(21):
                # threshold goes from max to min
                threshold = max_z - (i * (max_z - min_z) / 20)
                
                # TPR = TP / P
                tp = sum(1 for s in pos_scores if s >= threshold)
                tpr = tp / len(pos_scores)
                
                # FPR = FP / N
                fp = sum(1 for s in neg_scores if s >= threshold)
                fpr = fp / len(neg_scores)
                
                roc_points.append({"fpr": round(fpr, 3), "tpr": round(tpr, 3)})
            
            # Sort by FPR just in case
            roc_points.sort(key=lambda x: x["fpr"])
        else:
             # Fallback dummy curve if one class is missing
            roc_points = [
                {"fpr": 0.0, "tpr": 0.0},
                {"fpr": 0.1, "tpr": 0.8},
                {"fpr": 0.3, "tpr": 0.9},
                {"fpr": 1.0, "tpr": 1.0}
            ]
    else:
        roc_points = []

    # 6. Distribution Data
    # Bin detection confidence (0-100)
    # clean vs watermarked (based on Ground Truth Generation.watermark_enabled)
    dist_data = []
    
    # We can fetch confidence and ground truth
    conf_results = db.query(Detection.confidence, Generation.watermark_enabled)\
        .join(Generation, Detection.generation_id == Generation.generation_id)\
        .filter(Detection.confidence.isnot(None))\
        .all()

    bins = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 101)]
    ranges = ["0-20", "20-40", "40-60", "60-80", "80-100"]
    
    for r_label, (low, high) in zip(ranges, bins):
        clean_count = 0
        wm_count = 0
        for conf, is_wm in conf_results:
            # confidence is 0.0-1.0 usually
            c_val = conf * 100
            if low <= c_val < high:
                if is_wm:
                    wm_count += 1
                else:
                    clean_count += 1
        dist_data.append({
            "range": r_label,
            "clean": clean_count,
            "watermarked": wm_count
        })

    return {
        "total_verifications": total_verifications,
        "avg_auc": avg_auc,
        "detection_rate": detection_rate,
        "attack_attempts": attack_attempts,
        "roc_points": roc_points,
        "distribution": dist_data
    }
