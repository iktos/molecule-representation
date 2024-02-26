import React from 'react';

interface PopupProps {
  visible: boolean;
  position: { x: number; y: number };
  content: React.ReactNode;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ visible, position, content, onClose }) => {
  if (!visible) return null;

  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 100,
    position: 'absolute',
    top: position.y,
    left: position.x,
    zIndex: 100,
    backgroundColor: 'white',
    border: '1px solid black',
    padding: '8px',
    borderRadius: '5px',
  };

  return (
    <div style={style}>
      {content}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default Popup;
