import React, { useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import './App.css';
import './App.js';

function HouseCard({ houseNum, houseInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      {/* House Card -Clickable */}
      <div 
        onClick={() => setIsOpen(true)}
        className="house-card"
        style={{cursor: 'pointer'}}
      >
        <strong>House {houseNum}</strong>
        <span>{houseInfo.sign}</span>
      </div>

      {/* Modal */}
      <Modal 
        open={isOpen} 
        onClose={() => setIsOpen(false)} 
        center
        classNames={{
          modal: 'customModal',
          closeButton: 'customCloseButton'
        }}
        styles={{
          modal: {
            maxWidth: '500px',
            padding: '30px',
            borderRadius: '10px'
          },
          closeButton: {
            top: '10px',
            right: '10px',
            maxWidth: '30px'
          }
        }}
      >
        <h2 style={{ marginBottom: '20px' }}>House {houseNum}</h2>
        <div style={{marginBottom: '15px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '5px' }}>Life Area</h3>
          <p>Information about this house's meaning...</p>
        </div>
      </Modal>
    </>
  );
}

export default HouseCard;