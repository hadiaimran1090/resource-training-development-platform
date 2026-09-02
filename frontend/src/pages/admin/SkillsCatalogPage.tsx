import React, { useEffect, useState } from 'react';
import { skillApi } from '../../api/skillApi';
import type { Skill, SkillCategory } from '../../types/skill';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const SkillsCatalogPage: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<SkillCategory>('technical');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await skillApi.getSkills(selectedCategory !== 'all' ? selectedCategory : undefined);
      setSkills(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load skills catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, [selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingSkill(null);
    setFormName('');
    setFormCategory('technical');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (skill: Skill) => {
    setEditingSkill(skill);
    setFormName(skill.name);
    setFormCategory(skill.category);
    setIsModalOpen(true);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Skill name is required.');
      return;
    }

    setFormSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (editingSkill) {
        await skillApi.updateSkill(editingSkill.id, {
          name: formName.trim(),
          category: formCategory,
        });
        setSuccessMsg(`Skill '${formName.trim()}' updated successfully.`);
      } else {
        await skillApi.createSkill({
          name: formName.trim(),
          category: formCategory,
        });
        setSuccessMsg(`Skill '${formName.trim()}' created successfully.`);
      }

      setIsModalOpen(false);
      await loadSkills();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save skill.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skill: Skill) => {
    if (!window.confirm(`Are you sure you want to delete '${skill.name}' from the skills catalog?`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      await skillApi.deleteSkill(skill.id);
      setSuccessMsg(`Skill '${skill.name}' deleted successfully.`);
      await loadSkills();
    } catch (err: any) {
      setError(err?.response?.data?.message || `Cannot delete skill '${skill.name}'.`);
    }
  };

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryBadge = (category: string) => {
    const map: Record<string, { label: string; color: string }> = {
      technical: { label: 'Technical', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      secondary: { label: 'Secondary', color: 'bg-violet-50 text-violet-700 border-violet-200' },
      soft: { label: 'Soft Skill', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    };
    const item = map[category] || { label: category, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Skills Catalog Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global catalog of technical, secondary, and soft skills for RTDP resources & role profiles
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Skill</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search skills by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Category:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'technical', 'secondary', 'soft'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Loading skills catalog...
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium flex flex-col items-center justify-center gap-2">
            <Layers className="w-8 h-8 text-slate-300" />
            <span>No skills found matching your filter criteria.</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Skill Name</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSkills.map((skill) => (
                <tr key={skill.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-mono text-slate-400">#{skill.id}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">{skill.name}</td>
                  <td className="py-3.5 px-6">{getCategoryBadge(skill.category)}</td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(skill)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        title="Edit Skill"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Delete Skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {editingSkill ? 'Edit Skill Definition' : 'Create New Skill'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Java, Spring Boot, React, Communication"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Skill Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as SkillCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="technical">Technical (Core Tech & Frameworks)</option>
                  <option value="secondary">Secondary (Tools, Cloud, QA)</option>
                  <option value="soft">Soft Skill (Agile, Leadership, Communication)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
