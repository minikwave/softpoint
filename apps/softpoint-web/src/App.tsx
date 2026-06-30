import { Routes, Route, Navigate } from 'react-router-dom';
import MarketingLayout from './layouts/MarketingLayout';
import DAppLayout from './layouts/DAppLayout';
import Landing from './pages/Landing';
import Product from './pages/Product';
import Integrate from './pages/Integrate';
import Onboarding from './pages/Onboarding';
import Developers from './pages/Developers';
import AppHome from './pages/AppHome';
import EarnHub from './pages/EarnHub';
import AppMore from './pages/AppMore';
import Balance from './pages/Balance';
import Transactions from './pages/Transactions';
import Spend from './pages/Spend';
import Conversion from './pages/Conversion';
import Store from './pages/Store';
import VoucherStore from './pages/VoucherStore';
import MyRedemptions from './pages/MyRedemptions';
import ReceiptDetail from './pages/ReceiptDetail';
import EarnHistory from './pages/EarnHistory';
import EarnActivityAction from './pages/EarnActivityAction';
import EarnMap from './pages/EarnMap';
import Receipts from './pages/Receipts';
import EarnPayment from './pages/EarnPayment';
import Marketplace from './pages/Marketplace';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/product" element={<Product />} />
        <Route path="/integrate" element={<Integrate />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/developers" element={<Developers />} />
      </Route>

      <Route path="/app" element={<DAppLayout />}>
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<AppHome />} />
        <Route path="earn" element={<EarnHub />} />
        <Route path="more" element={<AppMore />} />
        <Route path="balance" element={<Balance />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="earn-history" element={<EarnHistory />} />
        <Route path="earn-payment" element={<EarnPayment />} />
        <Route path="earn/:slug" element={<EarnActivityAction />} />
        <Route path="earn-map" element={<EarnMap />} />
        <Route path="vouchers" element={<VoucherStore />} />
        <Route path="market" element={<Marketplace />} />
        <Route path="my-credits" element={<MyRedemptions />} />
        <Route path="receipts/:id" element={<ReceiptDetail />} />
        <Route path="spend" element={<Spend />} />
        <Route path="conversion" element={<Conversion />} />
        <Route path="store" element={<Store />} />
      </Route>
    </Routes>
  );
}
