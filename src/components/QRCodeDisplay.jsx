import { QRCodeSVG } from 'qrcode.react';

const QRCodeDisplay = ({ name, email, qrData }) => {
  const qrCodeString = qrData || JSON.stringify({
    name: name,
    email: email,
    type: 'member'
  });

  return (
    <QRCodeSVG
      value={qrCodeString}
      size={220}
      level="H"
      includeMargin={true}
      bgColor="#ffffff"
      fgColor="#000000"
    />
  );
};

export default QRCodeDisplay;
