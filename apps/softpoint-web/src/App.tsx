import { Routes, Route, Navigate } from 'react-router-dom';
import MarketingLayout from './layouts/MarketingLayout';
import DAppLayout from './layouts/DAppLayout';
import Landing from './pages/Landing';
import Product from './pages/Product';
import Developers from './pages/Developers';
import Balance from './pages/Balance';
import Transactions from './pages/Transactions';
import Spend from './pages/Spend';
import Conversion from './pages/Conversion';
import Store from './pages/Store';
import VoucherStore from './pages/VoucherStore';
import MyRedemptions from './pages/MyRedemptions';
import ReceiptDetail from './pages/ReceiptDetail';
import EarnHistory from './pages/EarnHistory';
import EarnMap from './pages/EarnMap';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/product" element={<Product />} />
        <Route path="/developers" element={<Developers />} />
      </Route>

      <Route path="/app" element={<DAppLayout />}>
        <Route index element={<Navigate to="/app/balance" replace />} />
        <Route path="balance" element={<Balance />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="earn-history" element={<EarnHistory />} />
        <Route path="earn-map" element={<EarnMap />} />
        <Route path="vouchers" element={<VoucherStore />} />
        <Route path="my-credits" element={<MyRedemptions />} />
        <Route path="receipts/:id" element={<ReceiptDetail />} />
        <Route path="spend" element={<Spend />} />
        <Route path="conversion" element={<Conversion />} />
        <Route path="store" element={<Store />} />
      </Route>
    </Routes>
  );
}
