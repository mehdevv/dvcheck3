import { useEffect, useRef } from 'react';
import { LogOut, User, Mail, Hash, UserCircle } from 'lucide-react';
import { Member } from '../App';
import QRCode from 'qrcode';

interface MemberDashboardProps {
  member: Member;
}

export function MemberDashboard({ member }: MemberDashboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const qrData = JSON.stringify({
        id: member.membershipId,
        name: member.name,
        email: member.email
      });
      
      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 220,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    }
  }, [member]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-black">DVcheck</h1>
          <button className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
            <LogOut className="w-5 h-5 text-red-500" />
          </button>
        </div>

        {/* QR Code Card */}
        <div className="mb-6 p-8 rounded-3xl bg-white shadow-sm">
          <div className="text-center">
            <h2 className="text-black mb-6">Membership QR Code</h2>
            
            <div className="inline-flex p-4 rounded-2xl bg-gray-50">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Your Information Section */}
        <div>
          <h2 className="text-black mb-4">Your Information</h2>
          
          <div className="space-y-3">
            {/* Name */}
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-500 uppercase tracking-wide mb-1">Name</div>
                <div className="text-black">{member.name}</div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-500 uppercase tracking-wide mb-1">Email</div>
                <div className="text-black break-all">{member.email}</div>
              </div>
            </div>

            {/* Member ID */}
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-500 uppercase tracking-wide mb-1">Member ID</div>
                <div className="text-black">{member.membershipId}</div>
              </div>
            </div>

            {/* Account Type */}
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-500 uppercase tracking-wide mb-1">Account Type</div>
                <div className="text-black">{member.accountType}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
