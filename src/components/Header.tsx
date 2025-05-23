import React from 'react';
import { Printer, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Printer className="h-6 w-6 text-print-blue" />
          <h1 className="text-xl font-bold text-print-blue">Amrut Offset Print Calculator</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          className="text-print-blue hover:text-print-blue/80"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
