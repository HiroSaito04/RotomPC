// rotompc-client/src/components/rotom-ai/RotomAISourceCard.jsx

const RotomAISourceCard = ({ source, index }) => {
  if (!source?.url) {
    return null;
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="rotom-ai-source"
    >
      <span className="rotom-ai-source__number">{index + 1}</span>

      <span className="rotom-ai-source__title">{source.title || "Source"}</span>

      <span className="rotom-ai-source__arrow">↗</span>
    </a>
  );
};

export default RotomAISourceCard;
