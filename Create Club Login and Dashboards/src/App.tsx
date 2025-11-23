import { MemberDashboard } from './components/MemberDashboard';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipDate: string;
  membershipId: string;
  accountType: string;
}

function App() {
  // Demo member data
  const demoMember: Member = {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@club.com',
    phone: '+1 234 567 8900',
    membershipDate: '2024-01-15',
    membershipId: 'f1b7aajALwpG2tCRd4GI',
    accountType: 'Member'
  };

  return <MemberDashboard member={demoMember} />;
}

export default App;
