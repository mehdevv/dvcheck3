import { QRCodeSVG } from 'qrcode.react';
import './QRCodeDisplay.css';

const QRCodeDisplay = ({ name, email, qrData }) => {
  // Generate QR code data string (email and name)
  const qrCodeString = qrData || JSON.stringify({
    name: name,
    email: email,
    type: 'member'
  });

  return (
    <div className="qr-code-container">
      <div className="qr-code-wrapper">
        <div className="qr-code-background">
          <QRCodeSVG
            value={qrCodeString}
            size={250}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#007AFF"
          />
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;

