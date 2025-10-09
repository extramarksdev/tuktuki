export const calculateSubscriptionRevenue = (subscriptions) => {
  return subscriptions.reduce((total, subscription) => {
    const paidCount = subscription.paid_count || 0;

    if (paidCount === 0) {
      return total;
    }

    if (
      subscription.plan &&
      subscription.plan.item &&
      subscription.plan.item.amount
    ) {
      const amountInRupees = subscription.plan.item.amount / 100;
      return total + paidCount * amountInRupees;
    }

    return total;
  }, 0);
};

export const getTotalSubscriptionCount = (subscriptions) => {
  return subscriptions.length;
};

export const getActiveSubscriptionCount = (subscriptions) => {
  return subscriptions.filter((sub) => sub.status === "active").length;
};

export const getCreatedSubscriptionCount = (subscriptions) => {
  return subscriptions.filter((sub) => sub.status === "created").length;
};

export const getCompletedSubscriptionCount = (subscriptions) => {
  return subscriptions.filter((sub) => sub.status === "completed").length;
};

export const getTotalPaidCount = (subscriptions) => {
  return subscriptions.reduce((total, sub) => total + (sub.paid_count || 0), 0);
};

export const formatSubscriptionStats = (subscriptions) => {
  return {
    total: getTotalSubscriptionCount(subscriptions),
    active: getActiveSubscriptionCount(subscriptions),
    created: getCreatedSubscriptionCount(subscriptions),
    completed: getCompletedSubscriptionCount(subscriptions),
    totalPaid: getTotalPaidCount(subscriptions),
    revenue: calculateSubscriptionRevenue(subscriptions),
  };
};
