import React, { useState, useEffect, useRef } from 'react';
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
  IconBuildingSkyscraper,
  IconPhoto,
  IconCheck,
  IconAlertCircle,
  IconMailDollar,
  IconCalendar,
  IconExternalLink,
  IconSearch,
  IconRefresh,
  IconFileSpreadsheet,
  IconDeviceFloppy,
  IconEye,
} from '@tabler/icons-react';
import { voucherApi } from '../api/voucherApi';
import { scanVoucherFile } from '../utils/voucherFileScanner';

export function VoucherReceiptCard({ userRole = 'SUPER_USER' }) {
  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Voucher Form State
  const [voucherId, setVoucherId] = useState(null);
  const [voucherType, setVoucherType] = useState('PAYMENT_VOUCHER');
  const [voucherNumber, setVoucherNumber] = useState(() => `VCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [issueDate, setIssueDate] = useState(() => new Date());
  const [dueDate, setDueDate] = useState(null);
  const [title, setTitle] = useState('Contractor & Maintenance Expense');
  const [letterheadType, setLetterheadType] = useState('iipc');
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  // Payee (Vendor / Contractor)
  const [payeeName, setPayeeName] = useState('Jacobson Carpentry');
  const [payeeEmail, setPayeeEmail] = useState('wyattjacobson369@gmail.com');
  const [payeeEmtEmail, setPayeeEmtEmail] = useState('wyattjacobson369@gmail.com');
  const [payeePhone, setPayeePhone] = useState('519-546-5593');
  const [payeeAddress, setPayeeAddress] = useState('74 Inkerman St, Guelph, ON N1H 3C9');
  const [payeeGstHst, setPayeeGstHst] = useState('727285003 RT 0001');

  // Payer (Customer / Organization)
  const [payerName, setPayerName] = useState('Alam Mohammed');
  const [payerCompany, setPayerCompany] = useState('IIPC Canada');
  const [payerAddress, setPayerAddress] = useState('132 main st south, Rockwood ON n0b 2k0');
  const [payerEmail, setPayerEmail] = useState('info@iipc.ca');

  // Line items
  const [items, setItems] = useState([
    {
      id: 1,
      description: 'Main floor framing, drywall repairs & carpentry trim work',
      quantity: 1,
      unitPrice: 1500.00,
      amount: 1500.00,
      taxable: true,
    },
  ]);

  // Tax configuration (default 13% HST)
  const [applyTax, setApplyTax] = useState(true);
  const [taxRate, setTaxRate] = useState(13.0);
  const [taxType, setTaxType] = useState('HST');

  // Notes & terms
  const [termsNotes, setTermsNotes] = useState(
    'Payment can be made through E-transfer to wyattjacobson369@gmail.com. Please include voucher number in memo.'
  );

  // Attached receipt preview & file
  const [receiptImageUrl, setReceiptImageUrl] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  // Generated document links
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState('');
  const [generatedDocxUrl, setGeneratedDocxUrl] = useState('');

  // Google Drive Modal State
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveFolderInput, setDriveFolderInput] = useState('1xfPlSXmPK6QsbeJQMlkLBmy1fFhUtVuP');
  const [driveResultLink, setDriveResultLink] = useState('');
  const [driveUploading, setDriveUploading] = useState(false);

  // Saved Vouchers List
  const [vouchersList, setVouchersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [listLoading, setListLoading] = useState(false);

  // File drop input ref
  const fileInputRef = useRef(null);

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
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        taxable: true,
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

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

  // Handle Scanning Files (Image, Excel, Text)
  const handleFileScan = async (file) => {
    if (!file) return;
    try {
      setScanning(true);
      setErrorMsg('');
      setSuccessMsg('');

      const scanned = await scanVoucherFile(file);

      if (scanned.voucherNumber) setVoucherNumber(scanned.voucherNumber);
      if (scanned.title) setTitle(scanned.title);
      if (scanned.issueDate) setIssueDate(new Date(scanned.issueDate));
      if (scanned.dueDate) setDueDate(new Date(scanned.dueDate));

      if (scanned.payee?.name) setPayeeName(scanned.payee.name);
      if (scanned.payee?.email) setPayeeEmail(scanned.payee.email);
      if (scanned.payee?.emtEmail) setPayeeEmtEmail(scanned.payee.emtEmail);
      if (scanned.payee?.phone) setPayeePhone(scanned.payee.phone);
      if (scanned.payee?.address) setPayeeAddress(scanned.payee.address);
      if (scanned.payee?.gstHstNumber) setPayeeGstHst(scanned.payee.gstHstNumber);

      if (scanned.payer?.name) setPayerName(scanned.payer.name);
      if (scanned.payer?.address) setPayerAddress(scanned.payer.address);

      if (scanned.items && scanned.items.length > 0) {
        setItems(scanned.items.map((it, idx) => ({ ...it, id: idx + 1 })));
      }

      if (scanned.taxConfig) {
        setApplyTax(Boolean(scanned.taxConfig.applyTax));
        if (scanned.taxConfig.rate) setTaxRate(scanned.taxConfig.rate);
        if (scanned.taxConfig.taxType) setTaxType(scanned.taxConfig.taxType);
      }

      if (scanned.termsNotes) setTermsNotes(scanned.termsNotes);

      if (scanned.receiptImageUrl) {
        setReceiptImageUrl(scanned.receiptImageUrl);
      }
      if (scanned.receiptFile) {
        setReceiptFile(scanned.receiptFile);
      }

      setSuccessMsg(`Successfully scanned and extracted details from ${file.name}!`);
    } catch (err) {
      console.error('File scan error:', err);
      setErrorMsg(`Could not parse file: ${err.message || 'Unknown error'}`);
    } finally {
      setScanning(false);
    }
  };

  // Save / Generate Voucher
  const handleGenerateVoucher = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Upload receipt file if present and not yet on server
      let uploadedReceiptUrl = receiptImageUrl;
      if (receiptFile) {
        try {
          const uploadRes = await voucherApi.uploadReceipt(receiptFile, userRole);
          if (uploadRes?.url) {
            uploadedReceiptUrl = uploadRes.url;
          }
        } catch (uErr) {
          console.warn('Receipt upload failed, keeping preview:', uErr);
        }
      }

      const payload = {
        voucherNumber: voucherNumber || `VCH-${Date.now().toString().slice(-6)}`,
        type: voucherType,
        issueDate: issueDate ? issueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : '',
        title,
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
        items: items.map((it) => ({
          description: it.description || 'General Service',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          amount: Number(it.amount) || 0,
          taxable: Boolean(it.taxable),
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
        receiptImageUrl: uploadedReceiptUrl,
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
                Scan receipts/bills, auto-extract items, configure 13% HST &amp; EMT Interac, select institutional letterhead, and upload directly to Google Drive.
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
              Google Drive Integrated
            </Badge>
          </Group>
        </Group>
      </Paper>

      {/* Alerts */}
      {successMsg && (
        <Alert
          icon={<IconCheck size={18} />}
          color="teal"
          title="Success"
          mb="md"
          withCloseButton
          onClose={() => setSuccessMsg('')}
        >
          {successMsg}
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

      {/* SECTION 1: SMART SCANNER & FILE INPUT */}
      <Paper p="md" withBorder radius="md" mb="lg" style={{ background: '#f8fafc' }}>
        <Group justify="space-between" align="center" mb="xs">
          <Group gap="xs">
            <ThemeIcon size="md" color="indigo" variant="light" radius="md">
              <IconScan size={18} />
            </ThemeIcon>
            <Text fw={700} size="sm" c="indigo.9">
              Smart File Scanner (Images, Excel, or Text)
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Upload contractor invoice or receipt to auto-fill form
          </Text>
        </Group>

        <Grid align="center" gutter="md">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Box
              style={{
                border: '2px dashed #94a3b8',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.xlsx,.xls,.csv,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileScan(file);
                }}
              />
              <Group justify="center" gap="sm">
                <IconUpload size={24} color="#6366f1" />
                <div>
                  <Text size="sm" fw={600} c="dark">
                    Click to browse or drop Image, Excel (.xlsx/.csv), or Text Receipt
                  </Text>
                  <Text size="xs" c="dimmed">
                    Scans vendor, amounts, items, HST, and Interac EMT email automatically
                  </Text>
                </div>
              </Group>
            </Box>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            {receiptImageUrl ? (
              <Group gap="sm" align="center">
                <Image
                  src={receiptImageUrl}
                  alt="Receipt Preview"
                  h={60}
                  w={90}
                  fit="contain"
                  radius="sm"
                  style={{ border: '1px solid #cbd5e1', background: '#ffffff' }}
                />
                <div>
                  <Badge color="teal" variant="filled" size="xs">
                    Receipt Attached
                  </Badge>
                  <Text size="xs" c="dimmed" mt={2}>
                    Included in voucher appendix
                  </Text>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="red"
                    onClick={() => {
                      setReceiptImageUrl(null);
                      setReceiptFile(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Group>
            ) : (
              <Group gap="xs">
                <IconPhoto size={20} color="#94a3b8" />
                <Text size="xs" c="dimmed">
                  No receipt image attached yet (optional).
                </Text>
              </Group>
            )}
          </Grid.Col>
        </Grid>
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

      {letterheadType === 'custom' && (
        <Paper p="sm" withBorder radius="md" mb="md" style={{ background: '#fefce8' }}>
          <TextInput
            label="Custom Logo URL (optional)"
            description="Provide direct URL to your institutional or contractor logo"
            value={customLogoUrl}
            onChange={(e) => setCustomLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
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
                    placeholder="519-546-5593"
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
                placeholder="74 Inkerman St, Guelph, ON N1H 3C9"
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

      {/* SECTION 4: LINE ITEMS TABLE */}
      <Paper p="md" withBorder radius="md" mb="md">
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="xs">
            <ThemeIcon size="sm" color="teal" variant="light">
              <IconFileText size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Expense Line Items &amp; Services
            </Text>
          </Group>
          <Button
            leftSection={<IconPlus size={14} />}
            size="compact-xs"
            variant="light"
            color="teal"
            onClick={addItemRow}
          >
            Add Line Item
          </Button>
        </Group>

        <Table.ScrollContainer minWidth={650}>
          <Table verticalSpacing="xs" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ background: '#f1f5f9' }}>
                <Table.Th style={{ width: '45%' }}>Description / Item Details</Table.Th>
                <Table.Th style={{ width: '12%', textAlign: 'center' }}>Qty</Table.Th>
                <Table.Th style={{ width: '18%', textAlign: 'right' }}>Unit Price ($)</Table.Th>
                <Table.Th style={{ width: '18%', textAlign: 'right' }}>Net Total ($)</Table.Th>
                <Table.Th style={{ width: '7%', textAlign: 'center' }}>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((it, idx) => (
                <Table.Tr key={it.id || idx}>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="e.g. Drywall repair & framing"
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
                  <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${Number(it.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <ActionIcon
                      size="sm"
                      color="red"
                      variant="subtle"
                      disabled={items.length <= 1}
                      onClick={() => removeItemRow(idx)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* SECTION 5: TAXES & TOTALS SUMMARY */}
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
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Total Net (Subtotal):
                </Text>
                <Text size="sm" fw={600}>
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
                    TOTAL TO PAY:
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
          <Button
            leftSection={<IconDeviceFloppy size={18} />}
            color="teal"
            size="md"
            onClick={handleGenerateVoucher}
          >
            {voucherId ? 'Update & Re-compile Voucher' : 'Save & Generate Voucher'}
          </Button>

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
