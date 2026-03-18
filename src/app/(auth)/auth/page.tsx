import { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "CommuTrip — Sign Up or Log In",
};

export default function AuthPage() {
  return <AuthForm />;
}
