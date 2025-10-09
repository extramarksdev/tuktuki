export const formatCurrency = (amount, currency = 'INR') => {
  if (currency === 'INR') {
    return `Rs${amount.toLocaleString('en-IN')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
};

export const formatNumber = (num) => {
  return num.toLocaleString('en-IN');
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

