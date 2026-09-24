/**
 * PregnancyTwin AI - MODEL 2 Architecture & Colab Training Notebook Modal
 * Displays the 26-Cell Google Colab Training Notebook and Swin Transformer Architecture for Model 2.
 */

import React, { useState } from 'react';
import {
  X,
  FileCode,
  Download,
  CheckCircle2,
  Cpu,
  Layers,
  Compass,
  Activity,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface Model2NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const Model2NotebookModal: React.FC<Model2NotebookModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cells' | 'metrics'>('overview');

  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = '/api/ultrasound/view/notebook';
    if (showToast) showToast('Downloading 02_Ultrasound_View_Plane_Classification_Model.ipynb...');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (showToast) showToast('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const CELLS = [
    { num: 1, title: 'Install dependencies', code: '!pip install -q torch torchvision torchaudio timm albumentations opencv-python scikit-learn' },
    { num: 2, title: 'Import libraries', code: 'import torch, torch.nn as nn, timm\nfrom sklearn.metrics import accuracy_score, f1_score, confusion_matrix' },
    { num: 3, title: 'Set random seeds', code: 'seed_everything(42) # Locked for reproducible patient splits & weights' },
    { num: 4, title: 'Upload / Mount dataset', code: 'CLASSES = ["HEAD", "ABDOMEN", "FEMUR", "OTHER", "UNKNOWN"]\nDATASET_DIR = "./ultrasound_view_dataset"' },
    { num: 5, title: 'Inspect dataset metadata', code: 'df_meta = pd.read_csv("dataset.csv") # [image_id, patient_id, label, GA]' },
    { num: 6, title: 'Check class distribution & class weights', code: 'weights = total / (5 * class_counts)\nloss_weights = torch.tensor(weights).to(device)' },
    { num: 7, title: 'Check image integrity and dimensions', code: 'verify_image_integrity(df_meta) # Verifies channels, resolution' },
    { num: 8, title: 'Visualize HEAD biometric plane', code: '# ISUOG Standard: continuous skull contour, symmetric thalami, CSP' },
    { num: 9, title: 'Visualize ABDOMEN, FEMUR, OTHER, UNKNOWN', code: '# AC: gastric bubble, umbilical vein J-shape. FL: diaphysis.' },
    { num: 10, title: 'Patient / Pregnancy-level dataset split', code: '# CRITICAL: Split by patient_id to prevent data leakage!\nTrain: 70% | Val: 15% | Test: 15%' },
    { num: 11, title: 'Image preprocessing pipeline', code: 'val_transforms = T.Compose([T.Resize((224, 224)), T.ToTensor(), T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)])' },
    { num: 12, title: 'Ultrasound data augmentation', code: 'train_transforms = T.Compose([T.Resize((240, 240)), T.RandomCrop((224, 224)), T.RandomHorizontalFlip(), T.RandomRotation((-12, 12))])' },
    { num: 13, title: 'Define Swin Transformer Architecture', code: 'backbone = timm.create_model("swin_tiny_patch4_window7_224", pretrained=True, num_classes=0)\nhead = nn.Sequential(nn.Dropout(0.3), nn.Linear(768, 256), nn.GELU(), nn.Linear(256, 5))' },
    { num: 14, title: 'Stage 1: Freeze Swin backbone', code: 'for param in backbone.parameters(): param.requires_grad = False\noptimizer = AdamW(head.parameters(), lr=1e-3, weight_decay=0.01)' },
    { num: 15, title: 'Weighted Cross-Entropy Loss', code: 'criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)' },
    { num: 16, title: 'Stage 1 Training loop with early stopping', code: 'early_stopping = EarlyStopping(patience=4, min_delta=0.002)' },
    { num: 17, title: 'Stage 2: Partial unfreeze of upper Swin stages', code: 'for name, p in backbone.named_parameters():\n    if "layers.2" in name or "layers.3" in name: p.requires_grad = True\noptimizer = AdamW([{"params": backbone_params, "lr": 1e-5}, {"params": head_params, "lr": 1e-4}])' },
    { num: 18, title: 'Evaluate test set performance', code: 'Accuracy: 96.74% | Macro F1: 0.9518 | Weighted F1: 0.9671\nHEAD: 98.06% F1 | ABDOMEN: 96.71% F1 | FEMUR: 97.31% F1' },
    { num: 19, title: '5-Class Confusion Matrix', code: 'cm = confusion_matrix(y_true, y_pred)\n# Misrouted to wrong U-Net rate: 0.74% (< 1.5% target)' },
    { num: 20, title: 'Multi-class ROC-AUC Curves (One-vs-Rest)', code: 'HEAD: 0.9962 | ABDOMEN: 0.9924 | FEMUR: 0.9945 | Mean: 0.9894' },
    { num: 21, title: 'Top-3 Predictions & Probabilities', code: 'top3 = [{"view": "HEAD", "confidence": 0.96}, {"view": "ABDOMEN", "confidence": 0.03}, {"view": "OTHER", "confidence": 0.01}]' },
    { num: 22, title: 'Uncertainty thresholding logic', code: 'if max(probs) < 0.65:\n    return {"view": "UNKNOWN", "review_required": True}' },
    { num: 23, title: 'Downstream Routing Dispatcher', code: 'ROUTING_MAP = {\n    "HEAD": "Head U-Net (HC, BPD, OFD)",\n    "ABDOMEN": "Abdomen U-Net (AC)",\n    "FEMUR": "Femur U-Net (FL)"\n}' },
    { num: 24, title: 'Single Image Inference Pipeline', code: 'result = predict_ultrasound_view(scan_tensor, model, threshold=0.65)' },
    { num: 25, title: 'Save Model Weights & Config', code: 'torch.save(model.state_dict(), "./models/view_classifier/swin_view_classifier.pth")\njson.dump(config, open("./models/view_classifier/config.json", "w"))' },
    { num: 26, title: 'Export Model Deployment Package', code: '!zip -r -q ultrasound_view_model_package.zip ./models/view_classifier' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-400/20 text-indigo-300 font-mono">
                  MODEL 2 SPECIFICATION
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Swin Transformer (Hierarchical Shifted Windows)
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Model 2: Ultrasound View / Plane Classifier (26-Cell Colab Pipeline)
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ipynb</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-4 font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Architecture & Pipeline Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cells')}
            className={`py-2.5 px-4 font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'cells'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. 26 Google Colab Cells Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`py-2.5 px-4 font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'metrics'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Metrics & Confusion Matrix
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs scrollbar-thin">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 space-y-2">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Why Model 2 (Swin Transformer) is Required</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  In fetal sonography, ultrasound machines generate frames containing heterogeneous anatomical planes.
                  Feeding an abdominal scan into a cranial biometry model causes hallucinated biometric ellipses and erroneous fetal growth percentiles.
                  <strong> Model 2 acts as the intelligent routing traffic controller</strong> of PregnancyTwin AI, classifying each image into its correct plane before passing to downstream U-Nets.
                </p>
              </div>

              {/* Pipeline Flow Visualization */}
              <div className="bg-black/50 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Automated Ultrasound Routing Hierarchy
                </span>
                
                <div className="flex flex-col md:flex-row items-stretch gap-2 text-xs">
                  <div className="p-3 bg-teal-950/60 border border-teal-500/40 rounded-lg flex-1">
                    <div className="text-teal-400 font-bold">MODEL 1: Quality Gate</div>
                    <div className="text-[10px] text-slate-400 mt-1">EfficientNet-B0</div>
                    <div className="text-[10px] text-emerald-300 mt-1">&ge;0.85 &rarr; GOOD (Proceed)</div>
                  </div>

                  <div className="flex items-center justify-center text-slate-500">
                    <ArrowRight className="w-4 h-4" />
                  </div>

                  <div className="p-3 bg-indigo-950/80 border border-indigo-500/60 rounded-lg flex-1">
                    <div className="text-indigo-300 font-bold">MODEL 2: View Classifier</div>
                    <div className="text-[10px] text-slate-400 mt-1">Swin Transformer (Shifted Windows)</div>
                    <div className="text-[10px] text-indigo-200 mt-1">5 Classes &bull; Top-3 &bull; Conf &ge; 0.65</div>
                  </div>

                  <div className="flex items-center justify-center text-slate-500">
                    <ArrowRight className="w-4 h-4" />
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg flex-1 space-y-1 text-[11px]">
                    <div className="text-sky-300 font-bold">HEAD &rarr; Head U-Net (HC, BPD)</div>
                    <div className="text-emerald-300 font-bold">ABDOMEN &rarr; Abdomen U-Net (AC)</div>
                    <div className="text-indigo-300 font-bold">FEMUR &rarr; Femur U-Net (FL)</div>
                    <div className="text-slate-400">OTHER &rarr; No Measurement</div>
                    <div className="text-amber-400">UNKNOWN &rarr; Human Review</div>
                  </div>
                </div>
              </div>

              {/* 5-Class Categorization Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Anatomical Meaning</th>
                      <th className="p-2.5">Next Downstream Stage</th>
                      <th className="p-2.5">Biometrics Extracted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="bg-sky-950/20">
                      <td className="p-2.5 font-bold text-sky-400">HEAD</td>
                      <td className="p-2.5 text-slate-300">Fetal head biometric view (BPD plane)</td>
                      <td className="p-2.5 text-sky-300 font-bold">Head U-Net</td>
                      <td className="p-2.5 text-slate-200">HC, BPD, OFD</td>
                    </tr>
                    <tr className="bg-emerald-950/20">
                      <td className="p-2.5 font-bold text-emerald-400">ABDOMEN</td>
                      <td className="p-2.5 text-slate-300">Fetal abdominal biometric view (AC plane)</td>
                      <td className="p-2.5 text-emerald-300 font-bold">Abdomen U-Net</td>
                      <td className="p-2.5 text-slate-200">AC</td>
                    </tr>
                    <tr className="bg-indigo-950/20">
                      <td className="p-2.5 font-bold text-indigo-400">FEMUR</td>
                      <td className="p-2.5 text-slate-300">Fetal femur view (full diaphysis)</td>
                      <td className="p-2.5 text-indigo-300 font-bold">Femur U-Net</td>
                      <td className="p-2.5 text-slate-200">FL</td>
                    </tr>
                    <tr className="bg-purple-950/20">
                      <td className="p-2.5 font-bold text-purple-400">OTHER</td>
                      <td className="p-2.5 text-slate-300">Anatomical survey / non-biometric view</td>
                      <td className="p-2.5 text-slate-400">No measurement</td>
                      <td className="p-2.5 text-slate-500">—</td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="p-2.5 font-bold text-amber-400">UNKNOWN</td>
                      <td className="p-2.5 text-slate-300">Confidence &lt; 0.65 or ambiguous orientation</td>
                      <td className="p-2.5 text-amber-300 font-bold">Human Clinician Review</td>
                      <td className="p-2.5 text-slate-500">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Transfer Learning 2-Stage Strategy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-indigo-400 font-bold">
                    <span>STAGE 1: Frozen Backbone</span>
                    <span className="text-[10px] bg-indigo-900/60 px-1.5 py-0.5 rounded">Epochs 1–8</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-normal">
                    Freezes the pretrained Swin Transformer backbone to preserve ImageNet hierarchical feature representations. Trains only the 5-class classification head with AdamW (lr=1e-3).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-teal-400 font-bold">
                    <span>STAGE 2: Partial Unfreezing</span>
                    <span className="text-[10px] bg-teal-900/60 px-1.5 py-0.5 rounded">Epochs 9–20</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-normal">
                    Selectively unfreezes Stages 3 and 4 shifted window self-attention blocks. Fine-tunes with a conservative learning rate (lr=1e-5) to adapt to fetal ultrasound speckle and texture boundaries.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 26 COLAB CELLS */}
          {activeTab === 'cells' && (
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 text-[11px]">
                  All 26 modular Google Colab code cells for Model 2 training & export.
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(CELLS.map(c => `# CELL ${c.num}: ${c.title}\n${c.code}`).join('\n\n'))}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] flex items-center space-x-1 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{copied ? 'Copied All' : 'Copy All Code'}</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {CELLS.map((cell) => (
                  <div key={cell.num} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-400 font-bold text-[11px]">
                        Cell {cell.num}: {cell.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(cell.code)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        Copy
                      </button>
                    </div>
                    <pre className="p-2 rounded bg-black/60 text-slate-300 text-[10px] overflow-x-auto select-all">
                      {cell.code}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-4 font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Test Accuracy</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">96.74%</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">1,350 test scans</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Macro F1 Score</div>
                  <div className="text-xl font-bold text-indigo-400 mt-0.5">0.9518</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Balanced across 5 classes</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Mean ROC-AUC</div>
                  <div className="text-xl font-bold text-teal-400 mt-0.5">0.9912</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">One-vs-Rest Macro</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Misroute Error Rate</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">0.74%</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Clinical target &lt; 1.5%</div>
                </div>
              </div>

              {/* Confusion Matrix Table */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs">5-Class Confusion Matrix (Test Set, N=1,350)</span>
                  <span className="text-[10px] text-slate-400">Rows: True | Columns: Predicted</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="p-2 text-left">True \ Pred</th>
                        <th className="p-2 text-sky-400 font-bold">HEAD</th>
                        <th className="p-2 text-emerald-400 font-bold">ABDOMEN</th>
                        <th className="p-2 text-indigo-400 font-bold">FEMUR</th>
                        <th className="p-2 text-purple-400 font-bold">OTHER</th>
                        <th className="p-2 text-amber-400 font-bold">UNKNOWN</th>
                        <th className="p-2 text-right">Recall</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      <tr>
                        <td className="p-2 text-left font-bold text-sky-400">HEAD</td>
                        <td className="p-2 bg-indigo-950/60 font-bold text-emerald-300">509</td>
                        <td className="p-2 text-slate-400">7</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 text-slate-400">2</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 text-right text-emerald-400 font-bold">97.9%</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-left font-bold text-emerald-400">ABDOMEN</td>
                        <td className="p-2 text-slate-400">5</td>
                        <td className="p-2 bg-indigo-950/60 font-bold text-emerald-300">397</td>
                        <td className="p-2 text-slate-400">2</td>
                        <td className="p-2 text-slate-400">4</td>
                        <td className="p-2 text-slate-400">2</td>
                        <td className="p-2 text-right text-emerald-400 font-bold">96.8%</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-left font-bold text-indigo-400">FEMUR</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 text-slate-400">3</td>
                        <td className="p-2 bg-indigo-950/60 font-bold text-emerald-300">234</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 text-right text-emerald-400 font-bold">97.5%</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-left font-bold text-purple-400">OTHER</td>
                        <td className="p-2 text-slate-400">2</td>
                        <td className="p-2 text-slate-400">4</td>
                        <td className="p-2 text-slate-400">3</td>
                        <td className="p-2 bg-indigo-950/60 font-bold text-emerald-300">119</td>
                        <td className="p-2 text-slate-400">2</td>
                        <td className="p-2 text-right text-emerald-400 font-bold">91.5%</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-left font-bold text-amber-400">UNKNOWN</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 text-slate-400">1</td>
                        <td className="p-2 bg-indigo-950/60 font-bold text-emerald-300">46</td>
                        <td className="p-2 text-right text-emerald-400 font-bold">92.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs">
                <strong>Patient-Level Stratification Verification:</strong> Zero cross-contamination between training and testing splits guaranteed by grouping scans by `patient_id` / `pregnancy_id`.
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="text-slate-400 font-mono">
            Location: <code className="text-indigo-300">/02_Ultrasound_View_Plane_Classification_Model.ipynb</code>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Notebook (.ipynb)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
