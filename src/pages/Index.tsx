import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { CallToActionSection } from "@/components/sections/CallToActionSection";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection onGetStarted={handleGetStarted} />
        <FeaturesSection />
        <PricingSection />
        <CallToActionSection onGetStarted={handleGetStarted} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
