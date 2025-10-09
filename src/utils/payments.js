export const groupPaymentsByDate = (payments) => {
  const grouped = {};

  payments.forEach((payment) => {
    if (payment.status === "captured" || payment.status === "authorized") {
      const date = new Date(payment.created_at * 1000).toLocaleDateString("en-IN");
      
      if (!grouped[date]) {
        grouped[date] = {
          date,
          count: 0,
          revenue: 0,
          payments: [],
        };
      }

      const amount = payment.amount / 100;
      grouped[date].count += 1;
      grouped[date].revenue += amount;
      grouped[date].payments.push(payment);
    }
  });

  return Object.values(grouped).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
};

export const calculateTotalPaymentRevenue = (payments) => {
  return payments.reduce((total, payment) => {
    if (payment.status === "captured" || payment.status === "authorized") {
      return total + payment.amount / 100;
    }
    return total;
  }, 0);
};

export const getPaymentStatusCount = (payments, status) => {
  return payments.filter((payment) => payment.status === status).length;
};

export const formatPaymentStats = (payments) => {
  return {
    total: payments.length,
    captured: getPaymentStatusCount(payments, "captured"),
    authorized: getPaymentStatusCount(payments, "authorized"),
    failed: getPaymentStatusCount(payments, "failed"),
    revenue: calculateTotalPaymentRevenue(payments),
    byDate: groupPaymentsByDate(payments),
  };
};

