"use client";
import React from "react";
import { Button } from "./ui/button";

type Props = { isPro: boolean };

const SubscriptionButton = ({ isPro }: Props) => {
  const [loading, setLoading] = React.useState(false);
  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/stripe");
      const response = await data.json();
      window.location.href = response.url;
    } catch (error) {
      console.log("billing error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button className="mt-4" disabled={loading} onClick={handleSubscribe}>
      {isPro ? "Manage Subscriptions" : "Upgrade"}
    </Button>
  );
};

export default SubscriptionButton;