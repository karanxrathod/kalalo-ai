import os
import sys
import argparse
import cv2
import numpy as np

def main():
    parser = argparse.ArgumentParser(description="Kalalo Person Cutout Mask Generator")
    parser.add_argument("--input", required=True, help="Path to input video")
    parser.add_argument("--output", required=True, help="Path to output mask video")
    parser.add_argument("--model", default="models/selfie_segmenter.tflite", help="Path to TFLite model")
    parser.add_argument("--trim-start", type=float, default=0.0, help="Trim start in seconds")
    parser.add_argument("--trim-end", type=float, default=None, help="Trim end in seconds")
    parser.add_argument("--preview-frame", default=None, help="Path to save preview transparent PNG")
    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    output_path = os.path.abspath(args.output)
    model_path = os.path.abspath(args.model)

    if not os.path.exists(input_path):
        print(f"ERROR: Input video not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found: {model_path}", file=sys.stderr)
        sys.exit(1)

    try:
        import mediapipe as mp
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
    except ImportError as e:
        print(f"ERROR: MediaPipe not available: {e}", file=sys.stderr)
        sys.exit(2)

    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.ImageSegmenterOptions(base_options=base_options, output_confidence_masks=True)
    segmenter = vision.ImageSegmenter.create_from_options(options)

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"ERROR: Could not open video: {input_path}", file=sys.stderr)
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    start_frame = int(args.trim_start * fps) if args.trim_start > 0 else 0
    end_frame = int(args.trim_end * fps) if args.trim_end is not None and args.trim_end > 0 else total_frames
    end_frame = min(end_frame, total_frames)

    frames_to_process = max(1, end_frame - start_frame)

    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h), isColor=True)

    preview_saved = False
    processed_count = 0

    print(f"START: Processing {frames_to_process} frames at {fps} fps ({w}x{h})", flush=True)

    try:
        while processed_count < frames_to_process:
            ret, frame = cap.read()
            if not ret:
                break

            # Process segmentation at 540x960 for fast CPU throughput
            scale = min(1.0, 960.0 / max(w, h))
            proc_w = int(w * scale)
            proc_h = int(h * scale)
            small = cv2.resize(frame, (proc_w, proc_h), interpolation=cv2.INTER_LINEAR)

            rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = segmenter.segment(mp_image)

            # Confidence mask 0: 0.0 = background, 1.0 = person
            if result.confidence_masks and len(result.confidence_masks) > 0:
                conf = result.confidence_masks[0].numpy_view()
                if len(conf.shape) == 3:
                    conf = conf[:, :, 0]
                # Scale float [0.0, 1.0] to uint8 [0, 255]
                person_mask_small = (np.clip(conf * 255.0, 0, 255)).astype(np.uint8)
            else:
                person_mask_small = np.zeros((proc_h, proc_w), dtype=np.uint8)

            # Smooth mask edges slightly with Gaussian blur for natural anti-aliasing
            person_mask_small = cv2.GaussianBlur(person_mask_small, (5, 5), 0)

            # Scale back to full resolution
            if scale < 1.0:
                full_mask = cv2.resize(person_mask_small, (w, h), interpolation=cv2.INTER_LINEAR)
            else:
                full_mask = person_mask_small

            # Write 3-channel grayscale frame for universal encoder compatibility
            mask_bgr = cv2.cvtColor(full_mask, cv2.COLOR_GRAY2BGR)
            out.write(mask_bgr)

            # Save preview frame if requested
            if args.preview_frame and not preview_saved and processed_count >= min(10, frames_to_process // 2):
                try:
                    # Create transparent BGRA cutout image
                    bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
                    bgra[:, :, 3] = full_mask
                    cv2.imwrite(os.path.abspath(args.preview_frame), bgra)
                    preview_saved = True
                    print(f"PREVIEW: Saved cutout preview to {args.preview_frame}", flush=True)
                except Exception as pe:
                    print(f"WARN: Failed to save preview frame: {pe}", file=sys.stderr)

            processed_count += 1
            if processed_count % 10 == 0 or processed_count == frames_to_process:
                percent = int((processed_count / frames_to_process) * 100)
                print(f"PROGRESS: {percent}", flush=True)

    finally:
        cap.release()
        out.release()

    # Fallback preview if not saved yet
    if args.preview_frame and not preview_saved and processed_count > 0:
        try:
            cap_single = cv2.VideoCapture(input_path)
            ret, frame = cap_single.read()
            cap_single.release()
            if ret:
                bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
                # Full opacity fallback
                cv2.imwrite(os.path.abspath(args.preview_frame), bgra)
        except Exception:
            pass

    print(f"DONE: Successfully wrote mask video to {output_path}", flush=True)

if __name__ == "__main__":
    main()
