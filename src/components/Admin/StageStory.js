import { useState } from 'react';
import './StageStory.css';

function StageStory({ story, onRegenerate, stageNumber, onSave, isSaved }) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await onRegenerate();
    setIsRegenerating(false);
  };

  if (!story) {
    return (
      <div className="stage-story-container">
        <div className="story-loading">
          <div className="story-loading-spinner"></div>
          <p>De AI schrijft een spannend verslag van deze etappe...</p>
        </div>
      </div>
    );
  }

  if (typeof story === 'object' && story.error) {
    return (
      <div className="stage-story-container">
        <div className="story-error">
          <h3>Er ging iets mis bij het genereren van het verhaal</h3>
          <p>{story.error}</p>
          <button onClick={handleRegenerate} disabled={isRegenerating}>
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  // Story is either a string or an object with content
  const storyText = typeof story === 'string' ? story : (story.content || story.story || JSON.stringify(story));

  return (
    <div className="stage-story-container">
      <div className="stage-story-header">
        <h2>
          <span className="story-icon">📰</span>
          Etappeverslag
        </h2>
        <button 
          className="regenerate-btn" 
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? 'Bezig...' : '🔄 Nieuw verhaal'}
        </button>
      </div>

      <div className="story-content">
        {storyText}
      </div>

      <div className="story-metadata">
        <div className="story-metadata-item">
          <strong>Etappe:</strong> {stageNumber}
        </div>
        <div className="story-metadata-item">
          <strong>Gegenereerd:</strong> {new Date().toLocaleString('nl-NL')}
        </div>
      </div>

      {!isSaved && (
        <div className="story-actions">
          <button 
            className="save-story-btn"
            onClick={onSave}
          >
            💾 Verhaal opslaan en publiceren
          </button>
        </div>
      )}

      {isSaved && (
        <div className="story-saved-message">
          ✅ Verhaal is opgeslagen en zichtbaar voor alle gebruikers!
        </div>
      )}
    </div>
  );
}

export default StageStory;
