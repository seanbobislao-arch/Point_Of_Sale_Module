let lastReceiptTx = null;

function buildReceiptHTML(tx){
  let itemLines = '';
  for(let i = 0; i < tx.items.length; i++){
    const it = tx.items[i];
    itemLines += '<div class="rline"><span>' + it.qty + '× ' + it.name + '</span><span>' + fmt(it.price * it.qty) + '</span></div>';
  }

  return '<div style="text-align:center;margin-bottom:8px;">' +
    '<strong>KALYE LUMA</strong><br>' + tx.receiptNo + '<br>' + niceDateTime(tx.dateISO) + '</div>' +
    '<hr>' + itemLines + '<hr>' +
    '<div class="rline"><span>Subtotal</span><span>' + fmt(tx.subtotal) + '</span></div>' +
    '<div class="rline"><span>Discount</span><span>-' + fmt(tx.discount) + '</span></div>' +
    '<div class="rline"><strong>Total</strong><strong>' + fmt(tx.total) + '</strong></div>' +
    '<div class="rline"><span>Payment</span><span>' + tx.payment + '</span></div>' +
    '<div class="rline"><span>Status</span><span>' + tx.status + '</span></div>';
}

function showReceipt(tx){
  lastReceiptTx = tx;
  document.getElementById('receiptContent').innerHTML = buildReceiptHTML(tx);
  openModal('receiptModal');
}

function printTransactionReceipt(tx){
  if(!tx){
    showToast('Nothing to print yet.', true);
    return;
  }
  const area = document.getElementById('printReceiptArea');
  area.innerHTML = buildReceiptHTML(tx);
  window.print();
}

function initReceiptModule(){
  document.getElementById('printReceiptBtn').addEventListener('click', function(){
    printTransactionReceipt(lastReceiptTx);
  });
}
