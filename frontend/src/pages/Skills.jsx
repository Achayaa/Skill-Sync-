import React, { useState, useEffect } from 'react';
import { skillsAPI, authAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './Skills.css';

const Skills = () => {
  const { user, updateUser } = useAuth();
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('offered');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [skillsRes, userRes] = await Promise.all([
        skillsAPI.getSkills(),
        authAPI.getMe(),
      ]);

      setSkills(skillsRes.data.skills);
      setUserSkills(userRes.data.user);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (skillId, proficiencyLevel = 'intermediate') => {
    try {
      if (activeTab === 'offered') {
        await skillsAPI.addOfferedSkill({ skillId, proficiencyLevel });
      } else {
        await skillsAPI.addRequestedSkill({ skillId, desiredLevel: proficiencyLevel });
      }
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding skill');
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      if (activeTab === 'offered') {
        await skillsAPI.removeOfferedSkill(skillId);
      } else {
        await skillsAPI.removeRequestedSkill(skillId);
      }
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error removing skill');
    }
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const userSkillIds = activeTab === 'offered'
    ? (userSkills?.skillsOffered || []).map(s => s.skill._id || s.skill)
    : (userSkills?.skillsRequested || []).map(s => s.skill._id || s.skill);

  const categories = ['all', 'coding', 'design', 'language', 'business', 'music', 'writing', 'photography', 'other'];

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="skills-page">
      <h1>Manage Your Skills</h1>

      <div className="skills-tabs">
        <button
          className={`tab ${activeTab === 'offered' ? 'active' : ''}`}
          onClick={() => setActiveTab('offered')}
        >
          Skills I Offer
        </button>
        <button
          className={`tab ${activeTab === 'requested' ? 'active' : ''}`}
          onClick={() => setActiveTab('requested')}
        >
          Skills I Want to Learn
        </button>
      </div>

      <div className="skills-filters">
        <select
          className="form-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="form-input"
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="skills-section">
        <h2>My {activeTab === 'offered' ? 'Offered' : 'Requested'} Skills</h2>
        {userSkillIds.length === 0 ? (
          <p className="empty-state">No skills added yet</p>
        ) : (
          <div className="skills-grid">
            {activeTab === 'offered'
              ? (userSkills?.skillsOffered || []).map((item) => (
                  <div key={item.skill._id || item.skill} className="skill-card">
                    <span className="skill-icon">{item.skill.icon || '📚'}</span>
                    <h3>{item.skill.name}</h3>
                    <p className="skill-level">Level: {item.proficiencyLevel}</p>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveSkill(item.skill._id || item.skill)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              : (userSkills?.skillsRequested || []).map((item) => (
                  <div key={item.skill._id || item.skill} className="skill-card">
                    <span className="skill-icon">{item.skill.icon || '📚'}</span>
                    <h3>{item.skill.name}</h3>
                    <p className="skill-level">Desired: {item.desiredLevel}</p>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveSkill(item.skill._id || item.skill)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
          </div>
        )}
      </div>

      <div className="skills-section">
        <h2>Available Skills</h2>
        <div className="skills-grid">
          {filteredSkills
            .filter((skill) => !userSkillIds.includes(skill._id))
            .map((skill) => (
              <div key={skill._id} className="skill-card">
                <span className="skill-icon">{skill.icon || '📚'}</span>
                <h3>{skill.name}</h3>
                <p className="skill-category">{skill.category}</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAddSkill(skill._id)}
                >
                  Add
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Skills;

