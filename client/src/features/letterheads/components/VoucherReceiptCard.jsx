import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Grid,
  Button,
  ActionIcon,
  TextInput,
  NumberInput,
  Textarea,
  Switch,
  Select,
  Table,
  Modal,
  Divider,
  ThemeIcon,
  Alert,
  Tooltip,
  Box,
  LoadingOverlay,
  Card,
  Image,
  SimpleGrid,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconReceiptTax,
  IconFileText,
  IconUpload,
  IconDownload,
  IconBrandGoogleDrive,
  IconScan,
  IconPlus,
  IconTrash,
  IconBuildingBank,
  IconPhoto,
  IconCheck,
  IconAlertCircle,
  IconMailDollar,
  IconExternalLink,
  IconSearch,
  IconRefresh,
  IconFileSpreadsheet,
  IconDeviceFloppy,
  IconEye,
  IconClipboardCheck,
  IconClearAll,
  IconReceipt,
} from '@tabler/icons-react';
import { voucherApi } from '../api/voucherApi';
import { scanVoucherFile } from '../utils/voucherFileScanner';

export function VoucherReceiptCard({ userRole = 'SUPER_USER' }) {
  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Voucher Form State
  const [voucherId, setVoucherId] = useState(null);
  const [voucherType, setVoucherType] = useState('PAYMENT_VOUCHER');
  const [voucherNumber, setVoucherNumber] = useState(() => `VCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [issueDate, setIssueDate] = useState(() => new Date());
  const [dueDate, setDueDate] = useState(null);
  const [title, setTitle] = useState('');
  const [letterheadType, setLetterheadType] = useState('iipc');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customLogoFileName, setCustomLogoFileName] = useState('');
  const [customLogoLoading, setCustomLogoLoading] = useState(false);
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);

  // Payee (Vendor / Contractor)
  const [payeeName, setPayeeName] = useState('');
  const [payeeEmail, setPayeeEmail] = useState('');
  const [payeeEmtEmail, setPayeeEmtEmail] = useState('');
  const [payeePhone, setPayeePhone] = useState('');
  const [payeeAddress, setPayeeAddress] = useState('');
  const [payeeGstHst, setPayeeGstHst] = useState('');

  // Payer (Customer / Organization)
  const [payerName, setPayerName] = useState('');
  const [payerCompany, setPayerCompany] = useState('IIPC Canada');
  const [payerAddress, setPayerAddress] = useState('132 main st south, Rockwood ON n0b 2k0');
  const [payerEmail, setPayerEmail] = useState('info@iipc.ca');

  // Line items (Clean starting state)
  const [items, setItems] = useState([
    {
      id: 1,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxable: true,
      receiptNumber: 1,
      receiptTitle: 'Receipt 1',
    },
  ]);

  // Tax configuration (default 13% HST)
  const [applyTax, setApplyTax] = useState(true);
  const [taxRate, setTaxRate] = useState(13.0);
  const [taxType, setTaxType] = useState('HST');

  // Notes & terms
  const [termsNotes, setTermsNotes] = useState('');

  // Attached receipts collection (Multiple receipts support)
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [receiptImageUrl, setReceiptImageUrl] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  // Receipt image modal preview
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageTitle, setModalImageTitle] = useState('');

  // Generated document links
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState('');
  const [generatedDocxUrl, setGeneratedDocxUrl] = useState('');

  // Paste Lines Modal State
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Google Drive Modal State
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveFolderInput, setDriveFolderInput] = useState('1xfPlSXmPK6QsbeJQMlkLBmy1fFhUtVuP');
  const [driveResultLink, setDriveResultLink] = useState('');
  const [driveUploading, setDriveUploading] = useState(false);

  // Saved Vouchers List
  const [vouchersList, setVouchersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [listLoading, setListLoading] = useState(false);

  // Refs for file pickers
  const fileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);

  // Initial load of vouchers
  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setListLoading(true);
      const res = await voucherApi.getVouchers(userRole);
      if (res?.vouchers) {
        setVouchersList(res.vouchers);
      }
    } catch (err) {
      console.warn('Could not load vouchers list:', err);
    } finally {
      setListLoading(false);
    }
  };

  // Reset / Clear Form to start from beginning
  const handleClearForm = () => {
    setVoucherId(null);
    setVoucherType('PAYMENT_VOUCHER');
    setVoucherNumber(`VCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setIssueDate(new Date());
    setDueDate(null);
    setTitle('');
    setLetterheadType('iipc');
    setCustomLogoUrl('');
    setCustomLogoFileName('');
    setShowDirectUrlInput(false);

    // Clear Payee
    setPayeeName('');
    setPayeeEmail('');
    setPayeeEmtEmail('');
    setPayeePhone('');
    setPayeeAddress('');
    setPayeeGstHst('');

    // Reset Payer
    setPayerName('');
    setPayerCompany('IIPC Canada');
    setPayerAddress('132 main st south, Rockwood ON n0b 2k0');
    setPayerEmail('info@iipc.ca');

    // Fresh blank line item
    setItems([
      {
        id: Date.now(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        taxable: true,
        receiptNumber: 1,
        receiptTitle: 'Receipt 1',
      },
    ]);

    setApplyTax(true);
    setTaxRate(13.0);
    setTaxType('HST');
    setTermsNotes('');

    // Clear attached receipts
    setReceiptFiles([]);
    setReceiptImageUrl(null);
    setReceiptFile(null);
    setGeneratedPdfUrl('');
    setGeneratedDocxUrl('');
    setDriveResultLink('');
    setErrorMsg('');
    setSuccessMsg('Form cleared! Ready to create a new voucher / receipt.');

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
  };

  // Line item handlers
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(field === 'quantity' ? value : copy[index].quantity) || 0;
        const price = Number(field === 'unitPrice' ? value : copy[index].unitPrice) || 0;
        copy[index].amount = parseFloat((qty * price).toFixed(2));
      }
      return copy;
    });
  };

  const addItemRow = () => {
    const currentMaxRcp = receiptFiles.length > 0 ? receiptFiles.length : 1;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        taxable: true,
        receiptNumber: currentMaxRcp,
        receiptTitle: `Receipt ${currentMaxRcp}`,
      },
    ]);
  };

  const addMultipleItemRows = (count = 3) => {
    const currentMaxRcp = receiptFiles.length > 0 ? receiptFiles.length : 1;
    setItems((prev) => {
      const newRows = [];
      for (let i = 0; i < count; i++) {
        newRows.push({
          id: Date.now() + i + Math.random(),
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          taxable: true,
          receiptNumber: currentMaxRcp,
          receiptTitle: `Receipt ${currentMaxRcp}`,
        });
      }
      return [...prev, ...newRows];
    });
  };

  // Remove individual line item
  const removeItemRow = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0) {
        return [
          {
            id: Date.now(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            taxable: true,
            receiptNumber: 1,
            receiptTitle: 'Receipt 1',
          },
        ];
      }
      return next;
    });
  };

  // Remove all line items
  const handleRemoveAllLines = () => {
    if (items.length > 1 || (items[0] && (items[0].description || items[0].amount > 0))) {
      if (window.confirm('Are you sure you want to remove all line items?')) {
        setItems([
          {
            id: Date.now(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            taxable: true,
            receiptNumber: 1,
            receiptTitle: 'Receipt 1',
          },
        ]);
      }
    }
  };

  const clearEmptyRows = () => {
    setItems((prev) => {
      const filtered = prev.filter((it) => (it.description && it.description.trim()) || Number(it.amount) > 0);
      if (filtered.length === 0) {
        return [{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, amount: 0, taxable: true, receiptNumber: 1, receiptTitle: 'Receipt 1' }];
      }
      return filtered;
    });
  };

  // Import pasted lines from Excel / Text
  const handleImportPastedLines = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const newItems = [];
    const activeReceiptNum = receiptFiles.length > 0 ? receiptFiles.length : 1;

    for (const line of lines) {
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(',');
      if (parts.length < 2) parts = line.split('|');

      if (parts.length >= 2) {
        const desc = parts[0].trim();
        let qty = 1;
        let price = 0;

        if (parts.length >= 3) {
          qty = parseFloat(parts[1]) || 1;
          price = parseFloat(parts[2].replace(/[$,]/g, '')) || 0;
        } else {
          price = parseFloat(parts[1].replace(/[$,]/g, '')) || 0;
        }

        if (desc) {
          newItems.push({
            id: Date.now() + Math.random(),
            description: desc,
            quantity: qty,
            unitPrice: price,
            amount: parseFloat((qty * price).toFixed(2)),
            taxable: true,
            receiptNumber: activeReceiptNum,
            receiptTitle: `Receipt ${activeReceiptNum}`,
          });
        }
      } else {
        const m = line.match(/^(.*?)(?:\s+|\$)+([0-9,]+\.[0-9]{2})$/);
        if (m) {
          const desc = m[1].trim();
          const amt = parseFloat(m[2].replace(/,/g, '')) || 0;
          newItems.push({
            id: Date.now() + Math.random(),
            description: desc,
            quantity: 1,
            unitPrice: amt,
            amount: amt,
            taxable: true,
            receiptNumber: activeReceiptNum,
            receiptTitle: `Receipt ${activeReceiptNum}`,
          });
        }
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => {
        const existing = prev.filter((it) => (it.description && it.description.trim()) || it.amount > 0);
        return [...existing, ...newItems];
      });
      setPasteText('');
      setPasteModalOpen(false);
      setSuccessMsg(`Imported ${newItems.length} line items successfully!`);
    } else {
      alert('Could not parse lines. Please format as "Description, Qty, Price" or "Description, Price".');
    }
  };

  // Group line items by receipt dynamically for subtotal breakdown
  const itemReceiptGroups = useMemo(() => {
    const groupMap = new Map();
    const groups = [];

    items.forEach((it, idx) => {
      const rNum = Number(it.receiptNumber) || 1;
      const rawTitle = it.receiptTitle || (it.receiptNumber ? `Receipt ${it.receiptNumber}` : 'General Items');
      const cleanTitle = String(rawTitle).replace(new RegExp(`^Receipt\\s*${rNum}:?\\s*`, 'i'), '').trim();
      const displayTitle = cleanTitle ? `Receipt ${rNum}: ${cleanTitle}` : `Receipt ${rNum}`;

      const key = `${rNum}_${cleanTitle}`;
      if (!groupMap.has(key)) {
        const grp = { number: rNum, title: displayTitle, items: [], subtotal: 0 };
        groupMap.set(key, grp);
        groups.push(grp);
      }
      const grp = groupMap.get(key);
      grp.items.push({ item: it, originalIndex: idx });
      grp.subtotal += Number(it.amount) || 0;
    });

    return groups;
  }, [items]);

  const hasMultipleReceipts = itemReceiptGroups.length > 1;

  // Subtotal & Grand Total calculations
  const calculateSubtotal = () => {
    return items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  };

  const calculateTax = () => {
    if (!applyTax) return 0;
    const taxableTotal = items
      .filter((it) => it.taxable)
      .reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    return parseFloat((taxableTotal * (Number(taxRate) / 100)).toFixed(2));
  };

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    const tax = calculateTax();
    return parseFloat((sub + tax).toFixed(2));
  };

  const subtotal = calculateSubtotal();
  const taxAmount = calculateTax();
  const grandTotal = calculateGrandTotal();

  // Multi-File Scanner Handler (Images, PDF, Excel, Text)
  const handleMultipleFilesScan = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    try {
      setScanning(true);
      setErrorMsg('');
      setSuccessMsg('');

      const newReceipts = [];
      const newItems = [];
      let firstPayeeDetected = null;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const currentReceiptNum = receiptFiles.length + i + 1;
        setScanStatusText(`Scanning receipt ${i + 1} of ${fileList.length}: ${file.name}...`);

        const scanned = await scanVoucherFile(file, (p) => {
          if (p.status === 'ocr') {
            const pct = Math.round((p.progress || 0) * 100);
            setScanStatusText(`Receipt ${i + 1} of ${fileList.length} (${file.name}): OCR reading text & amounts... (${pct}%)`);
          }
        });

        // Determine vendor name
        const rawVendor = scanned.payee?.name || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const vendorName = rawVendor.charAt(0).toUpperCase() + rawVendor.slice(1);
        const receiptTitle = `Receipt ${currentReceiptNum}: ${vendorName}`;

        if (!firstPayeeDetected && (scanned.payee?.name || scanned.payee?.emtEmail)) {
          firstPayeeDetected = scanned.payee;
        }

        let receiptSubtotal = 0;
        if (scanned.items && scanned.items.length > 0) {
          for (let itIdx = 0; itIdx < scanned.items.length; itIdx++) {
            const it = scanned.items[itIdx];
            const itAmt = Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0));
            receiptSubtotal += itAmt;
            newItems.push({
              id: Date.now() + Math.random(),
              description: it.description || 'Receipt Item',
              quantity: Number(it.quantity) || 1,
              unitPrice: Number(it.unitPrice) || itAmt,
              amount: itAmt,
              taxable: it.taxable !== undefined ? it.taxable : true,
              receiptNumber: currentReceiptNum,
              receiptTitle,
            });
          }
        } else {
          const amt = Number(scanned.totalAmount) || Number(scanned.subtotal) || 0;
          receiptSubtotal = amt;
          newItems.push({
            id: Date.now() + Math.random(),
            description: `${vendorName} - Receipt Items`,
            quantity: 1,
            unitPrice: amt,
            amount: amt,
            taxable: true,
            receiptNumber: currentReceiptNum,
            receiptTitle,
          });
        }

        newReceipts.push({
          id: Date.now() + i,
          receiptNumber: currentReceiptNum,
          title: receiptTitle,
          vendor: vendorName,
          fileName: file.name,
          previewUrl: scanned.receiptImageUrl,
          file,
          subtotal: receiptSubtotal,
          itemCount: scanned.items?.length || 1,
        });
      }

      // Merge payee if not already filled
      if (firstPayeeDetected) {
        if (!payeeName && firstPayeeDetected.name) setPayeeName(firstPayeeDetected.name);
        if (!payeeEmail && firstPayeeDetected.email) setPayeeEmail(firstPayeeDetected.email);
        if (!payeeEmtEmail && firstPayeeDetected.emtEmail) setPayeeEmtEmail(firstPayeeDetected.emtEmail);
        if (!payeePhone && firstPayeeDetected.phone) setPayeePhone(firstPayeeDetected.phone);
        if (!payeeAddress && firstPayeeDetected.address) setPayeeAddress(firstPayeeDetected.address);
        if (!payeeGstHst && firstPayeeDetected.gstHstNumber) setPayeeGstHst(firstPayeeDetected.gstHstNumber);
      }

      setReceiptFiles((prev) => [...prev, ...newReceipts]);
      if (newReceipts[0]?.previewUrl && !receiptImageUrl) {
        setReceiptImageUrl(newReceipts[0].previewUrl);
        setReceiptFile(newReceipts[0].file);
      }

      setItems((prev) => {
        const existingClean = prev.filter((it) => (it.description && it.description.trim()) || Number(it.amount) > 0);
        return [...existingClean, ...newItems];
      });

      setSuccessMsg(
        `Scanned and combined ${fileList.length} receipt${fileList.length > 1 ? 's' : ''} successfully! Extracted ${newItems.length} line item${newItems.length > 1 ? 's' : ''} categorized across Receipt 1, Receipt 2, etc.`
      );
    } catch (err) {
      console.error('Multi-file scan error:', err);
      setErrorMsg(`Could not scan files: ${err.message || 'Unknown error'}`);
    } finally {
      setScanning(false);
      setScanStatusText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove attached receipt
  const handleRemoveReceipt = (receiptIndex) => {
    const target = receiptFiles[receiptIndex];
    if (!target) return;

    const hasItems = items.some((it) => it.receiptNumber === target.receiptNumber);
    let removeItemsAlso = false;
    if (hasItems) {
      removeItemsAlso = window.confirm(
        `Remove "${target.title}"? Click OK to remove its line items as well, or Cancel to keep the line items.`
      );
    }

    setReceiptFiles((prev) => prev.filter((_, idx) => idx !== receiptIndex));

    if (removeItemsAlso) {
      setItems((prev) => {
        const filtered = prev.filter((it) => it.receiptNumber !== target.receiptNumber);
        return filtered.length > 0
          ? filtered
          : [{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, amount: 0, taxable: true, receiptNumber: 1, receiptTitle: 'Receipt 1' }];
      });
    }
  };

  // Custom Logo File Picker Handler
  const handleLogoPick = async (file) => {
    if (!file) return;
    try {
      setCustomLogoLoading(true);
      setCustomLogoFileName(file.name);

      const reader = new FileReader();
      reader.onload = () => {
        setCustomLogoUrl(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        const uploadRes = await voucherApi.uploadReceipt(file, userRole);
        if (uploadRes?.url) {
          setCustomLogoUrl(uploadRes.url);
        }
      } catch (uErr) {
        console.warn('Logo server upload note (using data URL fallback):', uErr);
      }

      setSuccessMsg(`Custom logo "${file.name}" selected and applied!`);
    } catch (err) {
      console.error('Logo pick error:', err);
      setErrorMsg(`Could not load logo: ${err.message}`);
    } finally {
      setCustomLogoLoading(false);
    }
  };

  const handleRemoveLogo = () => {
    setCustomLogoUrl('');
    setCustomLogoFileName('');
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
  };

  // Save / Generate Voucher
  const handleGenerateVoucher = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Upload all attached receipt images
      const uploadedUrls = [];
      const receiptsMeta = [];

      for (const r of receiptFiles) {
        let finalUrl = r.previewUrl;
        if (r.file) {
          try {
            const upRes = await voucherApi.uploadReceipt(r.file, userRole);
            if (upRes?.url) {
              finalUrl = upRes.url;
            }
          } catch (uErr) {
            console.warn('Receipt upload note for', r.title, uErr);
          }
        }
        if (finalUrl) {
          uploadedUrls.push(finalUrl);
          receiptsMeta.push({
            receiptNumber: r.receiptNumber,
            title: r.title,
            vendor: r.vendor,
            url: finalUrl,
            subtotal: r.subtotal || 0,
          });
        }
      }

      if (uploadedUrls.length === 0 && receiptImageUrl) {
        uploadedUrls.push(receiptImageUrl);
      }

      const cleanItems = items.filter((it) => (it.description && it.description.trim()) || Number(it.amount) > 0);
      const itemsToSave = cleanItems.length > 0 ? cleanItems : items;

      const payload = {
        voucherNumber: voucherNumber || `VCH-${Date.now().toString().slice(-6)}`,
        type: voucherType,
        issueDate: issueDate ? issueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : '',
        title: title || (itemsToSave[0]?.description || 'General Contractor Services'),
        letterheadType,
        customLogoUrl,
        payee: {
          name: payeeName,
          email: payeeEmail,
          emtEmail: payeeEmtEmail,
          phone: payeePhone,
          address: payeeAddress,
          gstHstNumber: payeeGstHst,
        },
        payer: {
          name: payerName,
          company: payerCompany,
          address: payerAddress,
          email: payerEmail,
        },
        items: itemsToSave.map((it) => ({
          description: it.description || 'General Service',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          amount: Number(it.amount) || 0,
          taxable: Boolean(it.taxable),
          receiptNumber: Number(it.receiptNumber) || 1,
          receiptTitle: it.receiptTitle || '',
        })),
        subtotal,
        taxConfig: {
          applyTax,
          taxType,
          rate: Number(taxRate) || 13,
          taxAmount,
        },
        totalAmount: grandTotal,
        termsNotes,
        receiptImageUrl: uploadedUrls[0] || null,
        receiptImageUrls: uploadedUrls,
        receipts: receiptsMeta,
      };

      let result;
      if (voucherId) {
        result = await voucherApi.updateVoucher(voucherId, payload, userRole);
      } else {
        result = await voucherApi.createVoucher(payload, userRole);
      }

      const saved = result.voucher;
      setVoucherId(saved._id);
      setGeneratedPdfUrl(result.pdfUrl || voucherApi.getPdfDownloadUrl(saved._id));
      setGeneratedDocxUrl(result.docxUrl || voucherApi.getDocxDownloadUrl(saved._id));

      setSuccessMsg(`Voucher #${saved.voucherNumber} generated successfully! Ready to download or save to Google Drive.`);
      loadVouchers();
    } catch (err) {
      console.error('Error generating voucher:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to generate voucher');
    } finally {
      setLoading(false);
    }
  };

  // Google Drive Upload
  const handleUploadToDrive = async () => {
    if (!voucherId) {
      setErrorMsg('Please click "Save & Generate Voucher" first before saving to Google Drive.');
      return;
    }
    try {
      setDriveUploading(true);
      setErrorMsg('');

      const res = await voucherApi.uploadToGoogleDrive(voucherId, driveFolderInput, userRole);
      if (res?.success) {
        setDriveResultLink(res.driveLink);
        setSuccessMsg(`Document saved to Google Drive successfully!`);
        loadVouchers();
      }
    } catch (err) {
      console.error('Google drive upload error:', err);
      setErrorMsg(`Drive upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setDriveUploading(false);
    }
  };

  // Populate form with existing voucher from table
  const handleEditVoucher = (vch) => {
    setVoucherId(vch._id);
    setVoucherType(vch.type || 'PAYMENT_VOUCHER');
    setVoucherNumber(vch.voucherNumber || '');
    setIssueDate(vch.issueDate ? new Date(vch.issueDate) : new Date());
    setDueDate(vch.dueDate ? new Date(vch.dueDate) : null);
    setTitle(vch.title || '');
    setLetterheadType(vch.letterheadType || 'iipc');
    setCustomLogoUrl(vch.customLogoUrl || '');

    setPayeeName(vch.payee?.name || '');
    setPayeeEmail(vch.payee?.email || '');
    setPayeeEmtEmail(vch.payee?.emtEmail || '');
    setPayeePhone(vch.payee?.phone || '');
    setPayeeAddress(vch.payee?.address || '');
    setPayeeGstHst(vch.payee?.gstHstNumber || '');

    setPayerName(vch.payer?.name || '');
    setPayerCompany(vch.payer?.company || '');
    setPayerAddress(vch.payer?.address || '');
    setPayerEmail(vch.payer?.email || '');

    if (vch.items && vch.items.length > 0) {
      setItems(vch.items.map((it, idx) => ({ ...it, id: idx + 1 })));
    }

    if (vch.taxConfig) {
      setApplyTax(Boolean(vch.taxConfig.applyTax));
      setTaxRate(vch.taxConfig.rate || 13);
      setTaxType(vch.taxConfig.taxType || 'HST');
    }

    setTermsNotes(vch.termsNotes || '');
    setReceiptImageUrl(vch.receiptImageUrl || null);

    if (vch.receipts && vch.receipts.length > 0) {
      setReceiptFiles(vch.receipts.map((r, idx) => ({
        id: idx + 1,
        receiptNumber: r.receiptNumber || (idx + 1),
        title: r.title || `Receipt ${idx + 1}`,
        vendor: r.vendor || '',
        previewUrl: r.url,
        subtotal: r.subtotal || 0,
      })));
    } else if (vch.receiptImageUrl) {
      setReceiptFiles([{
        id: 1,
        receiptNumber: 1,
        title: 'Receipt 1',
        vendor: vch.payee?.name || '',
        previewUrl: vch.receiptImageUrl,
        subtotal: vch.subtotal || 0,
      }]);
    } else {
      setReceiptFiles([]);
    }

    setGeneratedPdfUrl(vch.pdfUrl || voucherApi.getPdfDownloadUrl(vch._id));
    setGeneratedDocxUrl(vch.docxUrl || voucherApi.getDocxDownloadUrl(vch._id));
    if (vch.googleDriveLink) setDriveResultLink(vch.googleDriveLink);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete voucher
  const handleDeleteVoucher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this voucher?')) return;
    try {
      await voucherApi.deleteVoucher(id, userRole);
      if (voucherId === id) {
        setVoucherId(null);
        setGeneratedPdfUrl('');
        setGeneratedDocxUrl('');
      }
      loadVouchers();
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Filter vouchers
  const filteredVouchers = vouchersList.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.voucherNumber && v.voucherNumber.toLowerCase().includes(q)) ||
      (v.title && v.title.toLowerCase().includes(q)) ||
      (v.payee?.name && v.payee.name.toLowerCase().includes(q)) ||
      (v.payee?.emtEmail && v.payee.emtEmail.toLowerCase().includes(q))
    );
  });

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading || scanning} overlayProps={{ blur: 2 }} />

      {/* Header Banner */}
      <Paper
        p="md"
        radius="md"
        mb="lg"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #0f766e 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon size="xl" radius="md" color="emerald" variant="filled">
              <IconReceiptTax size={26} />
            </ThemeIcon>
            <div>
              <Title order={3} style={{ color: '#ffffff', fontWeight: 700 }}>
                Create Voucher &amp; Petty Cash Receipts
              </Title>
              <Text size="xs" style={{ color: '#d1fae5' }}>
                Upload multiple receipts, combine them into one invoice with Receipt 1 &amp; Receipt 2 subtotals, 13% HST, Interac EMT, and Google Drive upload.
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Badge color="yellow" variant="filled" size="sm">
              HST 13% Built-in
            </Badge>
            <Badge color="cyan" variant="filled" size="sm">
              Interac EMT Ready
            </Badge>
            <Badge color="teal" variant="light" size="sm">
              Multi-Receipt Batch
            </Badge>
            <Button
              variant="white"
              color="red"
              size="xs"
              radius="md"
              leftSection={<IconRefresh size={14} />}
              onClick={handleClearForm}
              title="Clear all fields and start a new voucher from scratch"
            >
              Clear Form / Start New
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Alerts */}
      {scanning && scanStatusText && (
        <Alert icon={<IconScan size={18} />} color="indigo" title="OCR &amp; Document Scanning Active" mb="md">
          {scanStatusText}
        </Alert>
      )}

      {successMsg && (
        <Alert
          icon={<IconCheck size={18} />}
          color="teal"
          title="Success"
          mb="md"
          withCloseButton
          onClose={() => setSuccessMsg('')}
        >
          <Group justify="space-between" align="center" wrap="wrap">
            <Text size="sm">{successMsg}</Text>
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconPlus size={14} />}
              onClick={handleClearForm}
            >
              Create Another Voucher (Start Fresh)
            </Button>
          </Group>
        </Alert>
      )}

      {errorMsg && (
        <Alert
          icon={<IconAlertCircle size={18} />}
          color="red"
          title="Attention"
          mb="md"
          withCloseButton
          onClose={() => setErrorMsg('')}
        >
          {errorMsg}
        </Alert>
      )}

      {/* SECTION 1: SMART SCANNER & MULTIPLE RECEIPTS UPLOAD */}
      <Paper p="md" withBorder radius="md" mb="lg" style={{ background: '#f8fafc' }}>
        <Group justify="space-between" align="center" mb="xs">
          <Group gap="xs">
            <ThemeIcon size="md" color="indigo" variant="light" radius="md">
              <IconScan size={18} />
            </ThemeIcon>
            <Text fw={700} size="sm" c="indigo.9">
              Smart File Scanner — Upload Multiple Receipts (Images, PDF, Excel, Text)
            </Text>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Upload multiple receipts at once or append more receipts to combine into one invoice
            </Text>
            <Button
              variant="subtle"
              color="gray"
              size="compact-xs"
              leftSection={<IconClearAll size={14} />}
              onClick={handleClearForm}
              title="Clear current inputs and start fresh"
            >
              Clear Form
            </Button>
          </Group>
        </Group>

        <Box
          style={{
            border: '2px dashed #6366f1',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            background: '#ffffff',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.xlsx,.xls,.csv,.txt"
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) handleMultipleFilesScan(files);
            }}
          />
          <Group justify="center" gap="md">
            <ThemeIcon size="xl" radius="xl" color="indigo" variant="light">
              <IconUpload size={28} />
            </ThemeIcon>
            <div>
              <Text size="md" fw={700} c="dark">
                Click to browse or drop Receipts &amp; Invoices (Select Multiple Files)
              </Text>
              <Text size="xs" c="dimmed">
                Extracts items with description &amp; amount figures for Receipt 1, Receipt 2, etc., plus EMT email, GST/HST, and totals.
              </Text>
            </div>
          </Group>
        </Box>

        {/* ATTACHED RECEIPTS GALLERY */}
        {receiptFiles.length > 0 && (
          <Paper mt="md" p="sm" withBorder radius="md" style={{ background: '#ffffff' }}>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <IconReceipt size={18} color="#059669" />
                <Text fw={700} size="xs" c="teal.9">
                  Attached Receipts ({receiptFiles.length} Total Combined)
                </Text>
              </Group>
              <Group gap="xs">
                <Button
                  size="compact-xs"
                  variant="light"
                  color="indigo"
                  leftSection={<IconPlus size={12} />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Add More Receipts
                </Button>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  leftSection={<IconTrash size={12} />}
                  onClick={() => {
                    if (window.confirm('Remove all attached receipt images?')) {
                      setReceiptFiles([]);
                      setReceiptImageUrl(null);
                    }
                  }}
                >
                  Clear All Receipts
                </Button>
              </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
              {receiptFiles.map((rf, idx) => (
                <Paper key={rf.id || idx} p="xs" withBorder radius="sm" style={{ background: '#f8fafc' }}>
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                      {rf.previewUrl ? (
                        <Image
                          src={rf.previewUrl}
                          alt={rf.title}
                          h={46}
                          w={46}
                          fit="cover"
                          radius="xs"
                          style={{ cursor: 'pointer', border: '1px solid #cbd5e1' }}
                          onClick={() => {
                            setModalImageSrc(rf.previewUrl);
                            setModalImageTitle(rf.title);
                            setPreviewModalOpen(true);
                          }}
                        />
                      ) : (
                        <ThemeIcon size="md" color="indigo" variant="light" radius="xs">
                          <IconFileText size={18} />
                        </ThemeIcon>
                      )}
                      <Box style={{ overflow: 'hidden' }}>
                        <Badge size="xs" color="teal" variant="filled">
                          Receipt {rf.receiptNumber}
                        </Badge>
                        <Text size="xs" fw={700} truncate title={rf.title}>
                          {rf.vendor || rf.fileName || `Receipt ${rf.receiptNumber}`}
                        </Text>
                        <Text size="11px" c="dimmed">
                          Subtotal: ${Number(rf.subtotal || 0).toFixed(2)}
                        </Text>
                      </Box>
                    </Group>

                    <Group gap={4}>
                      {rf.previewUrl && (
                        <Tooltip label="View Full Receipt Image">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="indigo"
                            onClick={() => {
                              setModalImageSrc(rf.previewUrl);
                              setModalImageTitle(rf.title);
                              setPreviewModalOpen(true);
                            }}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Remove this receipt">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => handleRemoveReceipt(idx)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Paper>
        )}
      </Paper>

      {/* SECTION 2: VOUCHER CONFIGURATION & LETTERHEAD SELECTION */}
      <Grid gutter="md" mb="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Select
            label="Letterhead Style"
            description="Institutional branding"
            value={letterheadType}
            onChange={(val) => setLetterheadType(val || 'iipc')}
            data={[
              { value: 'iipc', label: 'IIPC Canada Letterhead' },
              { value: 'bp', label: 'Blessed Properties (BP)' },
              { value: 'custom', label: 'Custom / Payee Branding' },
            ]}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Select
            label="Document Classification"
            description="Type of voucher"
            value={voucherType}
            onChange={(val) => setVoucherType(val || 'PAYMENT_VOUCHER')}
            data={[
              { value: 'PAYMENT_VOUCHER', label: 'Payment Voucher' },
              { value: 'PETTY_CASH', label: 'Petty Cash Receipt' },
              { value: 'INVOICE', label: 'Official Invoice' },
            ]}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <TextInput
            label="Voucher / Invoice #"
            description="Unique tracking number"
            value={voucherNumber}
            onChange={(e) => setVoucherNumber(e.target.value)}
            placeholder="e.g. SI-15 or VCH-2026-001"
            required
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <DatePickerInput
            label="Issue Date"
            description="Date issued (default today)"
            value={issueDate}
            onChange={setIssueDate}
            placeholder="Select date"
            valueFormat="YYYY-MM-DD"
          />
        </Grid.Col>
      </Grid>

      {/* CUSTOM LOGO / BRANDING FILE PICKER & PREVIEW */}
      {letterheadType === 'custom' && (
        <Paper p="md" withBorder radius="md" mb="md" style={{ background: '#fefce8', borderColor: '#fef08a' }}>
          <input
            ref={logoFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoPick(file);
            }}
          />

          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <ThemeIcon size="sm" color="yellow" variant="filled">
                <IconPhoto size={14} />
              </ThemeIcon>
              <Text fw={700} size="sm" c="yellow.9">
                Custom Logo / Payee Brand
              </Text>
            </Group>
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              onClick={() => setShowDirectUrlInput(!showDirectUrlInput)}
            >
              {showDirectUrlInput ? 'Hide URL input' : 'Or paste URL'}
            </Button>
          </Group>

          <Grid align="center" gutter="md">
            <Grid.Col span={{ base: 12, md: customLogoUrl ? 8 : 12 }}>
              <Box
                style={{
                  border: '2px dashed #eab308',
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'center',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => logoFileInputRef.current?.click()}
              >
                <Group justify="center" gap="sm">
                  <IconUpload size={22} color="#ca8a04" />
                  <div>
                    <Text size="sm" fw={600} c="dark">
                      Click to Browse and Pick Logo File from your computer
                    </Text>
                    <Text size="xs" c="dimmed">
                      Select PNG, JPEG, SVG, or WEBP contractor/organization logo
                    </Text>
                  </div>
                </Group>
              </Box>
            </Grid.Col>

            {customLogoUrl && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="xs" withBorder radius="sm" style={{ background: '#ffffff', textAlign: 'center' }}>
                  <Group justify="space-between" align="center">
                    <Image
                      src={customLogoUrl}
                      alt="Logo Preview"
                      h={50}
                      w={110}
                      fit="contain"
                      radius="xs"
                      style={{ border: '1px solid #f1f5f9', background: '#f8fafc', padding: '4px' }}
                    />
                    <Stack gap={4} align="flex-end">
                      <Badge color="teal" variant="filled" size="xs">
                        Logo Active
                      </Badge>
                      <Group gap={4}>
                        <Button
                          size="compact-xs"
                          variant="light"
                          color="indigo"
                          onClick={() => logoFileInputRef.current?.click()}
                        >
                          Change
                        </Button>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="red"
                          onClick={handleRemoveLogo}
                        >
                          Remove
                        </Button>
                      </Group>
                    </Stack>
                  </Group>
                </Paper>
              </Grid.Col>
            )}
          </Grid>

          {showDirectUrlInput && (
            <TextInput
              mt="xs"
              size="xs"
              label="Direct Logo URL (Alternative)"
              description="Direct image link (https://...)"
              value={customLogoUrl}
              onChange={(e) => setCustomLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          )}
        </Paper>
      )}

      {/* SECTION 3: PARTY DETAILS (PAYEE & PAYER) */}
      <Grid gutter="lg" mb="md">
        {/* Payee / Vendor (Paying to) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" withBorder radius="md" style={{ background: '#fdfbf7', borderColor: '#fed7aa' }}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <ThemeIcon size="sm" color="orange" variant="light">
                  <IconReceiptTax size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="orange.9">
                  Paying To: Payee / Vendor Details
                </Text>
              </Group>
              <Badge color="orange" variant="light" size="xs">
                Vendor
              </Badge>
            </Group>

            <Stack gap="xs">
              <TextInput
                label="Payee / Contractor Name"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. Jacobson Carpentry"
                required
              />

              {/* HIGHLIGHTED EMT EMAIL FIELD */}
              <Paper p="xs" radius="sm" style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
                <TextInput
                  label="Interac EMT (E-transfer) Email"
                  description="Where electronic money transfer should be sent"
                  value={payeeEmtEmail}
                  onChange={(e) => setPayeeEmtEmail(e.target.value)}
                  placeholder="e.g. wyattjacobson369@gmail.com"
                  leftSection={<IconMailDollar size={18} color="#16a34a" />}
                  styles={{
                    input: { fontWeight: 600, color: '#15803d' },
                  }}
                  required
                />
              </Paper>

              <Grid gutter="xs">
                <Grid.Col span={6}>
                  <TextInput
                    label="Phone"
                    value={payeePhone}
                    onChange={(e) => setPayeePhone(e.target.value)}
                    placeholder="2269390265"
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="GST / HST Registration #"
                    value={payeeGstHst}
                    onChange={(e) => setPayeeGstHst(e.target.value)}
                    placeholder="727285003 RT 0001"
                  />
                </Grid.Col>
              </Grid>

              <TextInput
                label="Payee Mailing Address"
                value={payeeAddress}
                onChange={(e) => setPayeeAddress(e.target.value)}
                placeholder="465 Barber Ave N, Listowel ON N4W 1G4"
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Customer / Payer (Bill To) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" withBorder radius="md" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <ThemeIcon size="sm" color="blue" variant="light">
                  <IconBuildingBank size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="blue.9">
                  Bill To: Payer / Customer Details
                </Text>
              </Group>
              <Badge color="blue" variant="light" size="xs">
                Customer
              </Badge>
            </Group>

            <Stack gap="xs">
              <TextInput
                label="Bill To (Name)"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Alam Mohammed"
                required
              />

              <TextInput
                label="Organization / Company"
                value={payerCompany}
                onChange={(e) => setPayerCompany(e.target.value)}
                placeholder="IIPC Canada / Blessed Properties"
              />

              <TextInput
                label="Billing Address"
                value={payerAddress}
                onChange={(e) => setPayerAddress(e.target.value)}
                placeholder="132 main st south, Rockwood ON n0b 2k0"
              />

              <TextInput
                label="Payer Email"
                value={payerEmail}
                onChange={(e) => setPayerEmail(e.target.value)}
                placeholder="info@iipc.ca"
              />
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* SECTION 4: LINE ITEMS TABLE WITH RECEIPT GROUPING & ITEM DELETION */}
      <Paper p="md" withBorder radius="md" mb="md">
        <Group justify="space-between" align="center" mb="sm" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon size="sm" color="teal" variant="light">
              <IconFileText size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Expense Line Items &amp; Services
            </Text>
            <Badge size="xs" color="teal" variant="light">
              {items.length} Line Item{items.length === 1 ? '' : 's'}
            </Badge>
            {hasMultipleReceipts && (
              <Badge size="xs" color="indigo" variant="outline">
                {itemReceiptGroups.length} Receipts Combined
              </Badge>
            )}
          </Group>

          <Group gap="xs" wrap="wrap">
            <Button
              leftSection={<IconPlus size={14} />}
              size="compact-xs"
              variant="filled"
              color="teal"
              onClick={addItemRow}
            >
              + Add Line Item
            </Button>
            <Button
              leftSection={<IconPlus size={14} />}
              size="compact-xs"
              variant="light"
              color="teal"
              onClick={() => addMultipleItemRows(3)}
            >
              + 3 Lines
            </Button>
            <Button
              leftSection={<IconClipboardCheck size={14} />}
              size="compact-xs"
              variant="light"
              color="indigo"
              onClick={() => setPasteModalOpen(true)}
            >
              Paste Lines
            </Button>
            <Button
              leftSection={<IconClearAll size={14} />}
              size="compact-xs"
              variant="subtle"
              color="gray"
              onClick={clearEmptyRows}
            >
              Clear Empty
            </Button>
            <Button
              leftSection={<IconTrash size={14} />}
              size="compact-xs"
              variant="subtle"
              color="red"
              onClick={handleRemoveAllLines}
              title="Delete all line items"
            >
              Remove All Lines
            </Button>
          </Group>
        </Group>

        <Table.ScrollContainer minWidth={740}>
          <Table verticalSpacing="xs" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ background: '#f1f5f9' }}>
                <Table.Th style={{ width: '40%' }}>Description / Item Details</Table.Th>
                <Table.Th style={{ width: '10%', textAlign: 'center' }}>Qty</Table.Th>
                <Table.Th style={{ width: '16%', textAlign: 'right' }}>Unit Price ($)</Table.Th>
                <Table.Th style={{ width: '14%', textAlign: 'center' }}>Sales Tax</Table.Th>
                <Table.Th style={{ width: '13%', textAlign: 'right' }}>Net Total ($)</Table.Th>
                <Table.Th style={{ width: '7%', textAlign: 'center' }}>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hasMultipleReceipts ? (
                // Grouped by Receipt
                itemReceiptGroups.map((grp) => (
                  <React.Fragment key={`group_${grp.number}_${grp.title}`}>
                    {/* Receipt Header Row */}
                    <Table.Tr style={{ background: '#eff6ff', borderTop: '2px solid #bfdbfe' }}>
                      <Table.Td colSpan={4}>
                        <Group gap="xs">
                          <ThemeIcon size="xs" color="indigo" variant="filled">
                            <IconReceipt size={12} />
                          </ThemeIcon>
                          <Text fw={700} size="xs" c="indigo.9">
                            🧾 {grp.title} ({grp.items.length} item{grp.items.length === 1 ? '' : 's'})
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontWeight: 700, color: '#1e40af' }}>
                        Subtotal: ${grp.subtotal.toFixed(2)}
                      </Table.Td>
                      <Table.Td />
                    </Table.Tr>

                    {/* Receipt Items */}
                    {grp.items.map(({ item: it, originalIndex: idx }) => (
                      <Table.Tr key={it.id || idx}>
                        <Table.Td>
                          <TextInput
                            size="xs"
                            value={it.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="e.g. Lumber, Drywall, Gas"
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            size="xs"
                            min={1}
                            value={it.quantity}
                            onChange={(val) => handleItemChange(idx, 'quantity', val)}
                            styles={{ input: { textAlign: 'center' } }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            size="xs"
                            min={0}
                            decimalScale={2}
                            fixedDecimalScale
                            prefix="$ "
                            value={it.unitPrice}
                            onChange={(val) => handleItemChange(idx, 'unitPrice', val)}
                            styles={{ input: { textAlign: 'right' } }}
                          />
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Switch
                            size="xs"
                            color="teal"
                            checked={Boolean(it.taxable)}
                            onChange={(e) => handleItemChange(idx, 'taxable', e.currentTarget.checked)}
                            label={it.taxable ? 'HST 13%' : '0% Exempt'}
                            styles={{
                              label: { fontSize: '11px', fontWeight: 600, color: it.taxable ? '#0f766e' : '#64748b' },
                            }}
                          />
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${Number(it.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Tooltip label="Remove this line item">
                            <ActionIcon
                              size="md"
                              color="red"
                              variant="light"
                              radius="md"
                              onClick={() => removeItemRow(idx)}
                              aria-label="Remove line item"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    ))}

                    {/* Receipt Subtotal Footer Row */}
                    <Table.Tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                      <Table.Td colSpan={4} style={{ textAlign: 'right' }}>
                        <Text size="xs" fw={600} c="dimmed">
                          Receipt {grp.number} Subtotal:
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ${grp.subtotal.toFixed(2)}
                      </Table.Td>
                      <Table.Td />
                    </Table.Tr>
                  </React.Fragment>
                ))
              ) : (
                // Standard Single Receipt View
                items.map((it, idx) => (
                  <Table.Tr key={it.id || idx}>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="e.g. Fence or Drywall repair"
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        size="xs"
                        min={1}
                        value={it.quantity}
                        onChange={(val) => handleItemChange(idx, 'quantity', val)}
                        styles={{ input: { textAlign: 'center' } }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        size="xs"
                        min={0}
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$ "
                        value={it.unitPrice}
                        onChange={(val) => handleItemChange(idx, 'unitPrice', val)}
                        styles={{ input: { textAlign: 'right' } }}
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Switch
                        size="xs"
                        color="teal"
                        checked={Boolean(it.taxable)}
                        onChange={(e) => handleItemChange(idx, 'taxable', e.currentTarget.checked)}
                        label={it.taxable ? 'HST 13%' : '0% Exempt'}
                        styles={{
                          label: { fontSize: '11px', fontWeight: 600, color: it.taxable ? '#0f766e' : '#64748b' },
                        }}
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${Number(it.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Tooltip label="Remove this line item">
                        <ActionIcon
                          size="md"
                          color="red"
                          variant="light"
                          radius="md"
                          onClick={() => removeItemRow(idx)}
                          aria-label="Remove line item"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* SECTION 5: TAXES & TOTALS SUMMARY (WITH INDIVIDUAL RECEIPT BREAKDOWN) */}
      <Grid gutter="md" mb="lg">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="xs">
            <Textarea
              label="Payment Terms, Instructions & Notes"
              description="Visible to the recipient on the bottom of the voucher"
              value={termsNotes}
              onChange={(e) => setTermsNotes(e.target.value)}
              minRows={3}
              autosize
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="md" withBorder radius="md" style={{ background: '#f8fafc' }}>
            <Stack gap="xs">
              {/* If multiple receipts, show breakdown per receipt */}
              {hasMultipleReceipts && (
                <Paper p="xs" radius="sm" withBorder style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
                  <Text fw={700} size="11px" c="dimmed" mb={4} style={{ letterSpacing: '0.5px' }}>
                    RECEIPTS BREAKDOWN:
                  </Text>
                  <Stack gap={4}>
                    {itemReceiptGroups.map((grp) => (
                      <Group key={`summary_${grp.number}_${grp.title}`} justify="space-between">
                        <Text size="xs" c="dark" fw={500}>
                          🧾 {grp.title}:
                        </Text>
                        <Text size="xs" fw={600}>
                          ${grp.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              )}

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {hasMultipleReceipts ? 'Combined Subtotal (Net):' : 'Total Net (Subtotal):'}
                </Text>
                <Text size="sm" fw={700}>
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </Group>

              {/* HST / GST Controls */}
              <Divider my={4} />
              <Group justify="space-between" align="center">
                <Switch
                  label={`Apply ${taxType}`}
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.currentTarget.checked)}
                  color="teal"
                  size="sm"
                />
                {applyTax && (
                  <Group gap={6} align="center">
                    <Select
                      size="xs"
                      w={80}
                      value={taxType}
                      onChange={(val) => setTaxType(val || 'HST')}
                      data={['HST', 'GST', 'PST']}
                    />
                    <NumberInput
                      size="xs"
                      w={85}
                      min={0}
                      max={100}
                      decimalScale={2}
                      suffix=" %"
                      value={taxRate}
                      onChange={(val) => setTaxRate(Number(val) || 13)}
                    />
                  </Group>
                )}
              </Group>

              {applyTax && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {taxType} ({taxRate}%):
                  </Text>
                  <Text size="xs" fw={600} c="teal.7">
                    + ${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Group>
              )}

              {/* GRAND TOTAL TO PAY BAR */}
              <Divider my={4} />
              <Paper
                p="sm"
                radius="sm"
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#ffffff',
                }}
              >
                <Group justify="space-between" align="center">
                  <Text fw={800} size="md" style={{ letterSpacing: '0.5px' }}>
                    {hasMultipleReceipts ? 'COMBINED TOTAL TO PAY:' : 'TOTAL TO PAY:'}
                  </Text>
                  <Text fw={900} size="lg" style={{ color: '#4ade80' }}>
                    ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Group>
              </Paper>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* SECTION 6: ACTION CONTROLS */}
      <Paper p="md" withBorder radius="md" mb="xl" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs">
            <Button
              leftSection={<IconDeviceFloppy size={18} />}
              color="teal"
              size="md"
              onClick={handleGenerateVoucher}
            >
              {voucherId ? 'Update & Re-compile Voucher' : 'Save & Generate Voucher'}
            </Button>
            <Button
              leftSection={<IconClearAll size={18} />}
              variant="default"
              size="md"
              onClick={handleClearForm}
              title="Clear all fields to create a new receipt from scratch"
            >
              Clear Form / New Voucher
            </Button>
          </Group>

          <Group gap="xs" wrap="wrap">
            {generatedPdfUrl && (
              <Button
                component="a"
                href={generatedPdfUrl}
                download
                target="_blank"
                leftSection={<IconDownload size={16} />}
                variant="light"
                color="red"
                size="sm"
              >
                Download PDF
              </Button>
            )}

            {generatedDocxUrl && (
              <Button
                component="a"
                href={generatedDocxUrl}
                download
                target="_blank"
                leftSection={<IconDownload size={16} />}
                variant="light"
                color="blue"
                size="sm"
              >
                Download Word (.docx)
              </Button>
            )}

            <Button
              leftSection={<IconBrandGoogleDrive size={16} />}
              color="indigo"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!voucherId) {
                  handleGenerateVoucher().then(() => setDriveModalOpen(true));
                } else {
                  setDriveModalOpen(true);
                }
              }}
            >
              Save to Google Drive
            </Button>
          </Group>
        </Group>

        {driveResultLink && (
          <Group mt="sm" gap="xs">
            <IconCheck size={16} color="#16a34a" />
            <Text size="xs" fw={600} c="green.8">
              Saved in Google Drive:
            </Text>
            <Button
              component="a"
              href={driveResultLink}
              target="_blank"
              size="compact-xs"
              variant="subtle"
              color="indigo"
              rightSection={<IconExternalLink size={12} />}
            >
              Open in Drive
            </Button>
          </Group>
        )}
      </Paper>

      {/* SECTION 7: SAVED VOUCHERS HISTORY TABLE */}
      <Paper p="md" withBorder radius="md">
        <Group justify="space-between" align="center" mb="sm" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon size="sm" color="dark" variant="light">
              <IconFileSpreadsheet size={16} />
            </ThemeIcon>
            <Title order={5}>Generated Vouchers &amp; Receipts History</Title>
            <Badge size="xs" color="gray">
              {filteredVouchers.length} Total
            </Badge>
          </Group>

          <Group gap="xs">
            <TextInput
              size="xs"
              placeholder="Search by #, payee, or EMT..."
              leftSection={<IconSearch size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ActionIcon size="sm" variant="light" color="gray" onClick={loadVouchers}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Group>
        </Group>

        <Table.ScrollContainer minWidth={700}>
          <Table verticalSpacing="xs" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ background: '#f8fafc' }}>
                <Table.Th>Voucher #</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Payee (Vendor)</Table.Th>
                <Table.Th>Interac EMT Email</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Total to Pay</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Drive</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredVouchers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                    {listLoading ? 'Loading vouchers...' : 'No vouchers generated yet. Create your first voucher above!'}
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredVouchers.map((v) => (
                  <Table.Tr key={v._id}>
                    <Table.Td fw={700} c="dark">
                      {v.voucherNumber}
                    </Table.Td>
                    <Table.Td style={{ fontSize: '12px' }}>
                      {v.issueDate ? new Date(v.issueDate).toLocaleDateString() : 'N/A'}
                    </Table.Td>
                    <Table.Td>{v.payee?.name || 'N/A'}</Table.Td>
                    <Table.Td>
                      {v.payee?.emtEmail ? (
                        <Badge color="green" variant="light" size="xs">
                          {v.payee.emtEmail}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">
                          None
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                      ${Number(v.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {v.googleDriveLink ? (
                        <Tooltip label="Open in Google Drive">
                          <ActionIcon
                            component="a"
                            href={v.googleDriveLink}
                            target="_blank"
                            size="sm"
                            color="indigo"
                            variant="subtle"
                          >
                            <IconBrandGoogleDrive size={16} />
                          </ActionIcon>
                        </Tooltip>
                      ) : (
                        <Text size="xs" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Group gap={4} justify="center">
                        <Tooltip label="Download PDF">
                          <ActionIcon
                            component="a"
                            href={voucherApi.getPdfDownloadUrl(v._id)}
                            download
                            size="sm"
                            color="red"
                            variant="subtle"
                          >
                            <IconDownload size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Download Word (.docx)">
                          <ActionIcon
                            component="a"
                            href={voucherApi.getDocxDownloadUrl(v._id)}
                            download
                            size="sm"
                            color="blue"
                            variant="subtle"
                          >
                            <IconFileText size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit / Populate">
                          <ActionIcon
                            size="sm"
                            color="teal"
                            variant="subtle"
                            onClick={() => handleEditVoucher(v)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon
                            size="sm"
                            color="red"
                            variant="subtle"
                            onClick={() => handleDeleteVoucher(v._id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* FULL RECEIPT IMAGE PREVIEW MODAL */}
      <Modal
        opened={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={
          <Group gap="xs">
            <IconReceipt size={20} color="#059669" />
            <Text fw={700}>{modalImageTitle || 'Receipt Photo Preview'}</Text>
          </Group>
        }
        size="xl"
        radius="md"
      >
        <Box style={{ textAlign: 'center', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
          {modalImageSrc && (
            <Image
              src={modalImageSrc}
              alt="Full Receipt"
              fit="contain"
              mah={650}
              radius="sm"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          )}
        </Box>
      </Modal>

      {/* PASTE ITEMS TABLE MODAL */}
      <Modal
        opened={pasteModalOpen}
        onClose={() => setPasteModalOpen(false)}
        title={
          <Group gap="xs">
            <IconClipboardCheck size={20} color="#4f46e5" />
            <Text fw={700}>Paste Line Items from Excel or Text</Text>
          </Group>
        }
        radius="md"
        size="lg"
      >
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Paste rows copied from Excel, Google Sheets, or a text file. Each row can be:
            <br />
            <strong>Description [Tab or Comma] Qty [Tab or Comma] Price</strong> (or simply <strong>Description, Price</strong>).
          </Text>

          <Textarea
            placeholder={`Fence\t1\t1250.00\nDrywall repair\t2\t350.00\nCarpentry trim\t1\t400.00`}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            minRows={6}
            autosize
          />

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setPasteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="teal" leftSection={<IconPlus size={16} />} onClick={handleImportPastedLines}>
              Import as Line Items
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* GOOGLE DRIVE FOLDER MODAL */}
      <Modal
        opened={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        title={
          <Group gap="xs">
            <IconBrandGoogleDrive size={20} color="#4f46e5" />
            <Text fw={700}>Save Voucher to Google Drive</Text>
          </Group>
        }
        radius="md"
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Enter the Google Drive folder URL or Folder ID where your team has granted write access.
          </Text>

          <TextInput
            label="Google Drive Folder URL or Folder ID"
            description="e.g. 1xfPlSXmPK6QsbeJQMlkLBmy1fFhUtVuP or https://drive.google.com/drive/folders/..."
            value={driveFolderInput}
            onChange={(e) => setDriveFolderInput(e.target.value)}
            placeholder="Paste folder link or ID here"
            required
          />

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setDriveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="indigo"
              leftSection={<IconBrandGoogleDrive size={16} />}
              loading={driveUploading}
              onClick={async () => {
                await handleUploadToDrive();
                setDriveModalOpen(false);
              }}
            >
              Upload Now
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}

export default VoucherReceiptCard;
