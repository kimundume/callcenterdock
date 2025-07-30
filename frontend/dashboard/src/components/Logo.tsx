import React from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ className = '', style = {} }) => {
  return (
    <div 
      className={`logo ${className}`}
      style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2E73FF',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...style
      }}
    >
      <div style={{
        width: '32px',
        height: '32px',
        backgroundColor: '#2E73FF',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        CD
      </div>
      <span>CallDocker</span>
    </div>
  );
};

export default Logo; 