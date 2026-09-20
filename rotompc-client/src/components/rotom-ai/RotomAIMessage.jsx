// rotompc-client/src/components/rotom-ai/RotomAIMessage.jsx

import RotomAISourceCard from "./RotomAISourceCard";

const RotomAIMessage = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`
        rotom-ai-message-row
        ${isUser ? "rotom-ai-message-row--user" : "rotom-ai-message-row--rotom"}
      `}
    >
      <article
        className={`
          rotom-ai-message

          ${isUser ? "rotom-ai-message--user" : "rotom-ai-message--rotom"}
        `}
      >
        {!isUser && (
          <div className="rotom-ai-message__badges">
            <span className="rotom-ai-message__badge rotom-ai-message__badge--rotom">
              RotomAI
            </span>

            {message.grounded && (
              <span className="rotom-ai-message__badge rotom-ai-message__badge--grounded">
                Web Grounded
              </span>
            )}

            {message.pokemonData?.length > 0 && (
              <span className="rotom-ai-message__badge rotom-ai-message__badge--pokeapi">
                PokéAPI Data
              </span>
            )}
          </div>
        )}

        <div className="rotom-ai-message__content">{message.content}</div>

        {!isUser && message.sources?.length > 0 && (
          <div className="rotom-ai-message__sources">
            <p className="rotom-ai-message__sources-title">Sources</p>

            <div className="rotom-ai-message__source-list">
              {message.sources.map((source, index) => (
                <RotomAISourceCard
                  key={`${source.url}-${index}`}
                  source={source}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {!isUser && message.model && (
          <p className="rotom-ai-message__model">{message.model}</p>
        )}
      </article>
    </div>
  );
};

export default RotomAIMessage;
