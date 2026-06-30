import React from "react";
import { BookOpen, Award, Sliders, Layers, Globe, HelpCircle } from "lucide-react";
import { OutlineConfig } from "../types";

interface ConfigFormProps {
  config: OutlineConfig;
  onChange: (config: OutlineConfig) => void;
}

export default function ConfigForm({ config, onChange }: ConfigFormProps) {
  const updateField = (key: keyof OutlineConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const handleLevelToggle = (level: string) => {
    const current = [...config.difficultyLevels];
    if (current.includes(level)) {
      // Keep at least one level selected
      if (current.length > 1) {
        updateField("difficultyLevels", current.filter(l => l !== level));
      }
    } else {
      updateField("difficultyLevels", [...current, level]);
    }
  };

  const levels = ["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"];

  return (
    <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-5 shadow-sm space-y-5">
      <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
        <Sliders className="h-4 w-4 text-sky-500" />
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">Cấu hình Đề cương</h3>
      </div>

      {/* Chapter & Grade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wide font-bold text-slate-400 flex items-center">
            <BookOpen className="h-3.5 w-3.5 mr-1 text-slate-500" /> Tên chương
          </label>
          <input
            type="text"
            value={config.chapterName}
            onChange={(e) => updateField("chapterName", e.target.value)}
            placeholder="Ví dụ: Hàm số lũy thừa..."
            className="w-full text-xs px-3 py-2 rounded border border-slate-750 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wide font-bold text-slate-400 flex items-center">
            <Award className="h-3.5 w-3.5 mr-1 text-slate-500" /> Khối lớp
          </label>
          <select
            value={config.gradeLevel}
            onChange={(e) => updateField("gradeLevel", e.target.value)}
            className="w-full text-xs px-3 py-2 rounded border border-slate-750 bg-slate-800 text-slate-100 focus:outline-none focus:border-sky-500"
          >
            <option value="6">Lớp 6</option>
            <option value="7">Lớp 7</option>
            <option value="8">Lớp 8</option>
            <option value="9">Lớp 9</option>
            <option value="10">Lớp 10</option>
            <option value="11">Lớp 11</option>
            <option value="12">Lớp 12</option>
          </select>
        </div>
      </div>

      {/* Examples count config */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase tracking-wide font-bold text-slate-400 flex items-center">
            <Layers className="h-3.5 w-3.5 mr-1 text-slate-500" /> Số lượng ví dụ/dạng
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            Từ {config.exampleCountMin} đến {config.exampleCountMax} ví dụ
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 bg-slate-800/50 px-2.5 py-1.5 rounded border border-slate-750/60">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Min:</span>
            <select
              value={config.exampleCountMin}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                updateField("exampleCountMin", val);
                if (config.exampleCountMax < val) {
                  updateField("exampleCountMax", val);
                }
              }}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none flex-1 text-right"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n} className="bg-slate-900 text-slate-200">{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/50 px-2.5 py-1.5 rounded border border-slate-750/60">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Max:</span>
            <select
              value={config.exampleCountMax}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                updateField("exampleCountMax", val);
                if (config.exampleCountMin > val) {
                  updateField("exampleCountMin", val);
                }
              }}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none flex-1 text-right"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n} className="bg-slate-900 text-slate-200">{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exercises count config */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase tracking-wide font-bold text-slate-400 flex items-center">
            <Layers className="h-3.5 w-3.5 mr-1 text-slate-500" /> Số lượng bài tập tự luyện
          </label>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-950/40 border border-sky-900/50 px-2 py-0.5 rounded-full">
            {config.exerciseCountPerType} bài tập/dạng
          </span>
        </div>

        {/* Dropdown 1 to 40 */}
        <div className="space-y-2">
          <select
            value={config.exerciseCountPerType}
            onChange={(e) => updateField("exerciseCountPerType", parseInt(e.target.value))}
            className="w-full text-xs px-3 py-2 rounded border border-slate-750 bg-slate-800 text-slate-100 focus:outline-none focus:border-sky-500"
          >
            {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} className="bg-slate-900 text-slate-200">
                Chọn {n} bài tập/dạng
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Difficulty Levels */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-wide font-bold text-slate-400 block">
          Mức độ câu hỏi tự luyện
        </label>
        <div className="grid grid-cols-2 gap-2">
          {levels.map((level) => {
            const isChecked = config.difficultyLevels.includes(level);
            return (
              <label
                key={level}
                onClick={() => handleLevelToggle(level)}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded border cursor-pointer select-none text-[11px] font-semibold transition-all duration-150 ${
                  isChecked
                    ? "border-sky-500 bg-sky-500/10 text-sky-400"
                    : "border-slate-800 bg-slate-900/20 hover:bg-slate-800 text-slate-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="hidden"
                />
                <span>{level}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Switch options */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        {/* Supplement from Internet */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-300 flex items-center">
              <Globe className="h-3.5 w-3.5 mr-1 text-slate-500" /> Bổ sung bài từ Internet
            </span>
            <span className="text-[10px] text-slate-500">
              Tự động tìm kiếm nếu PDF thiếu dạng bài
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateField("supplementFromInternet", !config.supplementFromInternet)}
            className={`relative inline-flex h-4.5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.supplementFromInternet ? "bg-sky-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                config.supplementFromInternet ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Generate Answer keys */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-300 flex items-center">
              <HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-500" /> Có đáp án & giải chi tiết
            </span>
            <span className="text-[10px] text-slate-500">
              Biên soạn bảng đáp án & giải câu vận dụng cao
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateField("hasAnswers", !config.hasAnswers)}
            className={`relative inline-flex h-4.5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.hasAnswers ? "bg-sky-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                config.hasAnswers ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
