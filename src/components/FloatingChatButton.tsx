import { useState } from "react";
import { MessageCircle, X, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Card className="w-80 shadow-2xl border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Assistentes IA
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Escolha sua assistente inteligente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start h-auto py-4"
                  variant="outline"
                  onClick={() => {
                    navigate("/ai-creator");
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3 text-left">
                    <Brain className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <div className="font-semibold">IA Criadora</div>
                      <div className="text-xs text-muted-foreground">
                        Crie pesquisas profissionais com metodologia avançada
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  className="w-full justify-start h-auto py-4"
                  variant="outline"
                  onClick={() => {
                    navigate("/ai-researcher");
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3 text-left">
                    <MessageCircle className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <div className="font-semibold">IA Pesquisadora</div>
                      <div className="text-xs text-muted-foreground">
                        Responda pesquisas guiado por IA
                      </div>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </motion.div>
    </>
  );
}
