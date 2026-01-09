# Tofu LoRA Training Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Train a custom SDXL LoRA on Tofu photos so generated images capture his specific face, markings, and features.

**Architecture:** Use kohya_ss GUI for LoRA training on local Mac M4 Max. Prepare 20+ training images with captions. Train with standard SDXL LoRA settings optimized for Apple Silicon.

**Tech Stack:** kohya_ss, Python 3.10+, PyTorch with MPS, SDXL base model

---

## Task 1: Install kohya_ss on Mac

**Files:**
- Create: `~/kohya_ss/` (installation directory)

**Step 1: Clone kohya_ss repository**

```bash
cd ~
git clone https://github.com/bmaltais/kohya_ss.git
cd kohya_ss
```

**Step 2: Run the setup script for Mac**

```bash
./setup.sh
```

Expected: Script installs Python dependencies, sets up virtual environment

**Step 3: Verify installation**

```bash
./gui.sh --help
```

Expected: Shows help output, no import errors

---

## Task 2: Convert HEIC images to JPEG

**Files:**
- Input: `/Users/home/Desktop/Tofu/Real Tofu/*.heic` (4 files)
- Output: `/Users/home/Desktop/Tofu/Real Tofu/*.jpg` (converted)

**Step 1: Convert HEIC files using sips (built into macOS)**

```bash
cd "/Users/home/Desktop/Tofu/Real Tofu"
for f in *.heic *.HEIC; do
  [ -f "$f" ] && sips -s format jpeg "$f" --out "${f%.*}.jpg"
done
```

Expected: 4 new .jpg files created

**Step 2: Verify conversions**

```bash
ls -la "/Users/home/Desktop/Tofu/Real Tofu/"*.jpg | wc -l
```

Expected: Count includes new converted files

---

## Task 3: Create training dataset directory structure

**Files:**
- Create: `/Users/home/Desktop/Tofu/training_data/`
- Create: `/Users/home/Desktop/Tofu/training_data/20_tofu/` (20 = repeats)

**Step 1: Create directory structure**

```bash
mkdir -p "/Users/home/Desktop/Tofu/training_data/20_tofu"
```

**Step 2: Copy and resize images to 1024x1024**

```bash
cd "/Users/home/Desktop/Tofu/Real Tofu"
for img in *.jpeg *.jpg; do
  [ -f "$img" ] && sips -Z 1024 "$img" --out "/Users/home/Desktop/Tofu/training_data/20_tofu/$img"
done
```

Expected: ~25 images copied and resized to training folder

**Step 3: Verify images**

```bash
ls "/Users/home/Desktop/Tofu/training_data/20_tofu/" | wc -l
```

Expected: 20-25 images

---

## Task 4: Create caption files for each image

**Files:**
- Create: `/Users/home/Desktop/Tofu/training_data/20_tofu/*.txt` (one per image)

**Step 1: Generate caption files**

Each image needs a `.txt` file with the same name containing the caption.

```bash
cd "/Users/home/Desktop/Tofu/training_data/20_tofu"
for img in *.jpeg *.jpg; do
  [ -f "$img" ] && echo "tofu, white french bulldog, cream colored fur, bat ears, black nose, dark eyes" > "${img%.*}.txt"
done
```

**Step 2: Verify caption files created**

```bash
ls "/Users/home/Desktop/Tofu/training_data/20_tofu/"*.txt | wc -l
```

Expected: Same count as images

**Step 3: Review a sample caption**

```bash
cat "/Users/home/Desktop/Tofu/training_data/20_tofu/$(ls /Users/home/Desktop/Tofu/training_data/20_tofu/*.txt | head -1)"
```

Expected: Shows caption text

---

## Task 5: Configure LoRA training parameters

**Files:**
- Create: `/Users/home/Desktop/Tofu/tofu_lora_config.json`

**Step 1: Create training config file**

```json
{
  "pretrained_model_name_or_path": "/Users/home/Desktop/APE YOLO/NFT/ComfyUI/models/checkpoints/sd_xl_base_1.0.safetensors",
  "train_data_dir": "/Users/home/Desktop/Tofu/training_data",
  "output_dir": "/Users/home/Desktop/Tofu/output",
  "output_name": "tofu_lora",
  "resolution": "1024,1024",
  "train_batch_size": 1,
  "learning_rate": 0.0001,
  "max_train_epochs": 10,
  "save_every_n_epochs": 2,
  "network_dim": 32,
  "network_alpha": 16,
  "optimizer_type": "AdamW8bit",
  "mixed_precision": "fp16",
  "seed": 42
}
```

**Step 2: Create output directory**

```bash
mkdir -p "/Users/home/Desktop/Tofu/output"
```

---

## Task 6: Launch kohya_ss GUI and start training

**Step 1: Start the GUI**

```bash
cd ~/kohya_ss
./gui.sh --listen 127.0.0.1 --server_port 7860
```

Expected: Web GUI opens at http://127.0.0.1:7860

**Step 2: Configure in GUI**

1. Go to "LoRA" tab
2. Set Source model: `/Users/home/Desktop/APE YOLO/NFT/ComfyUI/models/checkpoints/sd_xl_base_1.0.safetensors`
3. Set Image folder: `/Users/home/Desktop/Tofu/training_data`
4. Set Output folder: `/Users/home/Desktop/Tofu/output`
5. Set Output name: `tofu_lora`
6. Set Network Rank (dim): 32
7. Set Network Alpha: 16
8. Set Epochs: 10
9. Set Learning rate: 0.0001
10. Click "Start Training"

**Step 3: Monitor training**

Expected: Training runs for 2-4 hours on M4 Max
Expected output: `/Users/home/Desktop/Tofu/output/tofu_lora.safetensors`

---

## Task 7: Copy LoRA to ComfyUI and test

**Files:**
- Copy: `tofu_lora.safetensors` to ComfyUI loras folder

**Step 1: Copy trained LoRA**

```bash
cp "/Users/home/Desktop/Tofu/output/tofu_lora.safetensors" "/Users/home/Desktop/APE YOLO/NFT/ComfyUI/models/loras/"
```

**Step 2: Update ComfyUI workflow to use both LoRAs**

Modify workflow to chain two LoraLoader nodes:
1. First LoraLoader: `tofu_lora.safetensors` (weight: 0.8)
2. Second LoraLoader: `pixel-art-xl.safetensors` (weight: 0.8)

**Step 3: Test generation**

Update positive prompt to:
```
tofu, pixel art, isometric view, eboy style, white french bulldog, detailed pixel art, 16-bit style
```

**Step 4: Compare results**

Generate 4-5 images and compare to:
- Original IP-Adapter results (70% likeness)
- Expected: 85-95% likeness with correct markings appearing naturally

---

## Summary

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1 | Install kohya_ss | 15 min |
| 2 | Convert HEIC to JPEG | 2 min |
| 3 | Create training dataset structure | 5 min |
| 4 | Create caption files | 5 min |
| 5 | Configure training parameters | 5 min |
| 6 | Run training | 2-4 hours |
| 7 | Test in ComfyUI | 15 min |

**Total active time:** ~45 min (plus 2-4 hours training)
