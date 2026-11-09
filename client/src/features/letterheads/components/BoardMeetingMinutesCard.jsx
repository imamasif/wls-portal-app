import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  FileInput,
  Button,
  Paper,
  Alert,
  Modal,
  LoadingOverlay,
  ThemeIcon,
  Box,
  Divider,
  Grid,
  Progress,
  TextInput,
  Textarea,
  ActionIcon,
  Tooltip,
  Accordion,
  Select,
} from '@mantine/core';
import {
  IconUsersGroup,
  IconCheck,
  IconClock,
  IconWriting,
  IconMailForward,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconEye,
  IconSparkles,
  IconAlertCircle,
  IconUpload,
  IconRefresh,
  IconCalendar,
  IconMapPin,
  IconBuildingBank,
  IconPlus,
  IconTrash,
  IconEdit,
  IconShieldCheck,
  IconCircleCheck,
} from '@tabler/icons-react';
import { SignaturePadModal } from './SignaturePadModal';
import { letterheadApi } from '../api/letterheadApi';
import { parseDocxFile } from '../utils/docxPreviewParser';

export function BoardMeetingMinutesCard({ user, userRole = 'SUPER_USER' }) {
  const [meetingMinute, setMeetingMinute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Signing modal state
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [activeSignatory, setActiveSignatory] = useState(null);
  const [signDate, setSignDate] = useState(new Date().toISOString().split('T')[0]);
  const [signTime, setSignTime] = useState('9:00 AM Eastern Time');
  const [sigPadOpen, setSigPadOpen] = useState(false);
  const [tempSigDataUrl, setTempSigDataUrl] = useState(null);

  // Edit meta & content modals
  const [editMetaModalOpen, setEditMetaModalOpen] = useState(false);
  const [metaForm, setMetaForm] = useState({
    title: '',
    meetingDate: '',
    meetingTime: '',
    location: '',
    callToOrder: '',
  });

  const [editContentModalOpen, setEditContentModalOpen] = useState(false);
  const [rawContentText, setRawContentText] = useState('');

  // Add signatory modal
  const [addSigModalOpen, setAddSigModalOpen] = useState(false);
  const [newSigName, setNewSigName] = useState('');
  const [newSigRole, setNewSigRole] = useState('DIRECTOR');
  const [portalUsers, setPortalUsers] = useState([]);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

  // Upload Word document replacement
  const [uploadDocx, setUploadDocx] = useState(null);
  const [uploadingDocx, setUploadingDocx] = useState(false);

  // Load meeting minutes on mount
  const fetchMinutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await letterheadApi.getMeetingMinutes(userRole);
      if (data?.meetingMinute) {
        setMeetingMinute(data.meetingMinute);
        setMetaForm({
          title: data.meetingMinute.title || '',
          meetingDate: data.meetingMinute.meetingDate || '',
          meetingTime: data.meetingMinute.meetingTime || '',
          location: data.meetingMinute.location || '',
          callToOrder: data.meetingMinute.callToOrder || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch meeting minutes:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load meeting minutes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinutes();
    // Load portal users for signatory picker
    letterheadApi
      .getPortalUsers(userRole)
      .then((res) => {
        if (res?.users) setPortalUsers(res.users);
      })
      .catch((e) => console.warn('Could not load portal users:', e));
  }, []);

  const signatories = meetingMinute?.signatories || [];
  const signedCount = signatories.filter((s) => s.isSigned).length;
  const totalSignatories = signatories.length;
  const percentSigned = totalSignatories > 0 ? Math.round((signedCount / totalSignatories) * 100) : 0;
  const allSigned = totalSignatories > 0 && signedCount === totalSignatories;

  // Open Signing Modal for specific signatory
  const handleOpenSignModal = (signatory) => {
    setActiveSignatory(signatory);
    setSignDate(signatory.signDate || meetingMinute?.meetingDate || new Date().toISOString().split('T')[0]);
    setSignTime(signatory.signTime || meetingMinute?.meetingTime || '9:00 AM Eastern Time');
    setTempSigDataUrl(signatory.signatureDataUrl || null);
    setSigningModalOpen(true);
  };

  // Submit Signature for active signatory
  const handleSaveActiveSignature = async () => {
    if (!meetingMinute || !activeSignatory) return;
    try {
      setActionLoading(true);
      setError(null);

      const res = await letterheadApi.signMeetingMinute({
        id: meetingMinute._id,
        signatoryId: activeSignatory._id,
        signatureDataUrl: tempSigDataUrl,
        signDate,
        signTime,
        userRole,
      });

      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
        setSuccessMsg(`Signature recorded successfully for ${activeSignatory.name}!`);
        setSigningModalOpen(false);
      }
    } catch (err) {
      console.error('Error applying signature:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save signature');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Meta Details
  const handleSaveMeta = async () => {
    if (!meetingMinute) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await letterheadApi.updateMeetingMinutes({
        id: meetingMinute._id,
        data: metaForm,
        userRole,
      });
      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
        setEditMetaModalOpen(false);
        setSuccessMsg('Meeting details updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update meeting details');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload custom Word file for meeting minutes
  const handleUploadDocxChange = async (file) => {
    setUploadDocx(file);
    if (!file || !meetingMinute) return;

    try {
      setUploadingDocx(true);
      setError(null);
      const parsed = await parseDocxFile(file);
      if (parsed.success && parsed.html) {
        const res = await letterheadApi.updateMeetingMinutes({
          id: meetingMinute._id,
          data: {
            contentHtml: parsed.html,
            uploadedDocxName: file.name,
          },
          userRole,
        });
        if (res?.meetingMinute) {
          setMeetingMinute(res.meetingMinute);
          setSuccessMsg(`Word file "${file.name}" uploaded and parsed into meeting minutes!`);
        }
      } else {
        setError(parsed.error || 'Could not parse uploaded Word document body.');
      }
    } catch (err) {
      setError(err.message || 'Failed to process document file');
    } finally {
      setUploadingDocx(false);
    }
  };

  // Reset to default
  const handleResetDefault = async () => {
    if (!window.confirm('Reset this meeting minute to the official 2026 3rd Quarter template?')) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await letterheadApi.resetDefaultMeetingMinutes(userRole);
      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
        setSuccessMsg('Meeting minute reset to default official template!');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Finalize & Dispatch Email to info@ & accounts@iipccanada.com
  const handleFinalizeAndDispatch = async () => {
    if (!meetingMinute) return;
    const confirmMsg =
      'Finalize this Board Meeting Minute with IIPC Letterhead and send official Word & PDF files to info@iipccanada.com and accounts@iipccanada.com?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await letterheadApi.finalizeAndDispatchMeetingMinutes({
        id: meetingMinute._id,
        userRole,
      });

      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
        setSuccessMsg(
          'Official Board Meeting Minutes generated with IIPC Letterhead and dispatched via email to info@iipccanada.com and accounts@iipccanada.com!'
        );
      }
    } catch (err) {
      console.error('Finalize error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to finalize and dispatch document');
    } finally {
      setActionLoading(false);
    }
  };

  // Add new signatory
  const handleAddSignatory = async () => {
    if (!newSigName.trim() || !meetingMinute) return;
    try {
      setActionLoading(true);
      const updatedSigs = [
        ...signatories,
        {
          name: newSigName.trim().toUpperCase(),
          role: newSigRole.toUpperCase(),
          isSigned: false,
        },
      ];
      const res = await letterheadApi.updateMeetingMinutes({
        id: meetingMinute._id,
        data: { signatories: updatedSigs },
        userRole,
      });
      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
        setNewSigName('');
        setAddSigModalOpen(false);
        setSuccessMsg(`Signatory ${newSigName} added successfully!`);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete signatory
  const handleDeleteSignatory = async (sigId) => {
    if (!window.confirm('Remove this signatory from the board minutes?')) return;
    try {
      setActionLoading(true);
      const updatedSigs = signatories.filter((s) => s._id !== sigId);
      const res = await letterheadApi.updateMeetingMinutes({
        id: meetingMinute._id,
        data: { signatories: updatedSigs },
        userRole,
      });
      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder style={{ background: '#ffffff' }}>
      <LoadingOverlay visible={loading || actionLoading} overlayProps={{ radius: 'md', blur: 2 }} />

      <Stack gap="md">
        {/* Card Header Banner */}
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <Group gap="xs">
            <ThemeIcon color="teal" size="xl" radius="md" variant="gradient" gradient={{ from: 'teal', to: 'indigo', deg: 135 }}>
              <IconUsersGroup size={24} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md" c="dark.8">
                Board Meeting Minutes &amp; Director Signatures
              </Text>
              <Text size="xs" c="dimmed">
                IIPC Canada Official Board Minutes &bull; Multi-Director Sign-off &bull; Auto-Email to info@ &amp; accounts@iipccanada.com
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Badge color="teal" variant="light" size="sm" leftSection={<IconBuildingBank size={12} />}>
              IIPC Letterhead
            </Badge>
            <Badge color={allSigned ? 'green' : 'orange'} variant="filled" size="sm">
              {allSigned ? 'All 7 Signed' : `${signedCount} of ${totalSignatories} Signed`}
            </Badge>
            {meetingMinute?.emailDispatched && (
              <Badge color="blue" variant="light" size="sm" leftSection={<IconMailForward size={12} />}>
                Dispatched
              </Badge>
            )}
          </Group>
        </Group>

        {/* Alerts / Feedback */}
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="sm" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert icon={<IconCircleCheck size={16} />} color="teal" radius="sm" withCloseButton onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {/* Progress & Quick Stats Card */}
        <Paper p="sm" withBorder radius="md" style={{ background: '#f0fdfa', borderColor: '#ccfbf1' }}>
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Text size="xs" fw={700} c="teal.9">
                  Board Sign-off Progress:
                </Text>
                <Text size="xs" fw={600} c="dark.7">
                  {signedCount} of {totalSignatories} Directors / Officers Signed ({percentSigned}%)
                </Text>
              </Group>

              <Group gap="xs">
                <Button size="compact-xs" variant="light" color="teal" leftSection={<IconEdit size={12} />} onClick={() => setEditMetaModalOpen(true)}>
                  Edit Meeting Meta
                </Button>
                <Button size="compact-xs" variant="light" color="indigo" leftSection={<IconPlus size={12} />} onClick={() => setAddSigModalOpen(true)}>
                  Add Signatory
                </Button>
                <Button size="compact-xs" variant="subtle" color="gray" leftSection={<IconRefresh size={12} />} onClick={handleResetDefault}>
                  Reset to Template
                </Button>
              </Group>
            </Group>

            <Progress value={percentSigned} color={allSigned ? 'teal' : 'indigo'} radius="xl" size="md" striped animated={!allSigned} />
          </Stack>
        </Paper>

        {/* Meeting Details Bar */}
        <Paper p="xs" withBorder radius="md" style={{ background: '#f8fafc' }}>
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Group gap={6}>
                <ThemeIcon size="xs" radius="sm" color="teal" variant="light">
                  <IconCalendar size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">DATE:</Text>
                <Text size="xs" fw={600}>{meetingMinute?.meetingDate || 'November 7th, 2026'}</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Group gap={6}>
                <ThemeIcon size="xs" radius="sm" color="blue" variant="light">
                  <IconClock size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">TIME:</Text>
                <Text size="xs" fw={600}>{meetingMinute?.meetingTime || '9:00 AM Eastern Time'}</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Group gap={6}>
                <ThemeIcon size="xs" radius="sm" color="indigo" variant="light">
                  <IconMapPin size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">LOCATION:</Text>
                <Text size="xs" fw={600}>{meetingMinute?.location || 'Online- Zoom'}</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Group gap={6}>
                <ThemeIcon size="xs" radius="sm" color="grape" variant="light">
                  <IconShieldCheck size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">CALL TO ORDER:</Text>
                <Text size="xs" fw={600} truncate>{meetingMinute?.callToOrder || '3rd Quarter Meeting'}</Text>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Signatories Grid (Director Signature Boxes) */}
        <div>
          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <Text fw={700} size="sm" c="dark.8">
                Board Signatures Matrix &amp; Execution Boxes
              </Text>
              <Badge size="xs" color="indigo" variant="light">
                {signatories.length} Listed Officers
              </Badge>
            </Group>
            <Text size="11px" c="dimmed">
              Each officer can sign directly via screen canvas pad or image upload with verification date &amp; time.
            </Text>
          </Group>

          <Grid gutter="sm">
            {signatories.map((sig) => {
              const isCurrentLoggedUser =
                user?.name && sig.name && user.name.toLowerCase().includes(sig.name.split(' ')[0].toLowerCase());

              return (
                <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3.4 }} key={sig._id || sig.name}>
                  <Paper
                    p="sm"
                    withBorder
                    radius="md"
                    style={{
                      background: sig.isSigned ? '#f0fdf4' : isCurrentLoggedUser ? '#eef2ff' : '#ffffff',
                      borderColor: sig.isSigned ? '#86efac' : isCurrentLoggedUser ? '#818cf8' : '#e2e8f0',
                      transition: 'all 0.2s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isCurrentLoggedUser ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                    }}
                  >
                    <div>
                      <Group justify="space-between" align="flex-start" mb={4}>
                        <Badge
                          size="xs"
                          variant="filled"
                          color={
                            sig.role.includes('SECRETARY')
                              ? 'teal'
                              : sig.role.includes('EXECUTIVE')
                              ? 'indigo'
                              : sig.role.includes('MANAGING')
                              ? 'blue'
                              : 'cyan'
                          }
                        >
                          {sig.role}
                        </Badge>
                        <Group gap={4}>
                          {sig.isSigned ? (
                            <Badge color="green" size="xs" variant="light" leftSection={<IconCheck size={10} />}>
                              Signed
                            </Badge>
                          ) : (
                            <Badge color="orange" size="xs" variant="light" leftSection={<IconClock size={10} />}>
                              Pending
                            </Badge>
                          )}
                          <ActionIcon
                            size="xs"
                            color="gray"
                            variant="subtle"
                            onClick={() => handleDeleteSignatory(sig._id)}
                            title="Remove Signatory"
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      <Text fw={700} size="sm" c="dark.9" mt={2}>
                        {sig.name}
                      </Text>

                      {/* Signature Box Area */}
                      <Box
                        mt="xs"
                        p="xs"
                        style={{
                          background: '#ffffff',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '6px',
                          minHeight: '62px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {sig.isSigned && sig.signatureDataUrl ? (
                          <img
                            src={sig.signatureDataUrl}
                            alt="Signature"
                            style={{ maxHeight: '48px', maxWidth: '100%', objectFit: 'contain' }}
                          />
                        ) : sig.isSigned ? (
                          <Text size="xs" c="green.8" fw={600} style={{ fontStyle: 'italic' }}>
                            &ldquo;{sig.name}&rdquo; (Verified)
                          </Text>
                        ) : (
                          <Text size="11px" c="dimmed" style={{ fontStyle: 'italic' }}>
                            (Awaiting Signature)
                          </Text>
                        )}
                      </Box>

                      {/* Date & Time display */}
                      <Text size="11px" c="dimmed" mt={6}>
                        <strong>Date:</strong> {sig.signDate || 'Not set'}
                      </Text>
                      <Text size="11px" c="dimmed">
                        <strong>Time:</strong> {sig.signTime || 'Not set'}
                      </Text>
                    </div>

                    <Button
                      mt="xs"
                      size="xs"
                      fullWidth
                      variant={sig.isSigned ? 'light' : 'filled'}
                      color={sig.isSigned ? 'teal' : 'indigo'}
                      leftSection={<IconWriting size={14} />}
                      onClick={() => handleOpenSignModal(sig)}
                    >
                      {sig.isSigned ? 'Update / Re-sign' : 'Sign & Date'}
                    </Button>
                  </Paper>
                </Grid.Col>
              );
            })}
          </Grid>
        </div>

        {/* Meeting Minutes Content Viewer & Custom Upload */}
        <Paper p="sm" withBorder radius="md" style={{ background: '#fdfdfd' }}>
          <Stack gap="xs">
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="xs">
                <ThemeIcon color="teal" size="sm" radius="md">
                  <IconBuildingBank size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="dark.8">
                  Official Meeting Minutes Document Preview (With IIPC Letterhead)
                </Text>
              </Group>

              <Group gap="xs">
                <FileInput
                  size="xs"
                  placeholder="Upload Word File (.docx)..."
                  accept=".docx,.doc"
                  value={uploadDocx}
                  onChange={handleUploadDocxChange}
                  leftSection={<IconUpload size={14} />}
                  clearable
                  style={{ width: '220px' }}
                />
                <Button size="xs" variant="light" color="teal" leftSection={<IconEdit size={13} />} onClick={() => setEditContentModalOpen(true)}>
                  Edit Text
                </Button>
              </Group>
            </Group>

            {/* Document Canvas Preview Box */}
            <Box
              p="md"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                maxHeight: '420px',
                overflowY: 'auto',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
              }}
            >
              {/* IIPC Header Banner */}
              <Box mb="md" ta="center">
                <img src="/letterheads/iipc_header.jpg" alt="IIPC Header" style={{ width: '100%', maxHeight: '110px', objectFit: 'contain' }} />
              </Box>

              {/* Centered Bismillah */}
              <Box mb="md" ta="center">
                <img src="/letterheads/iipc_bismillah.jpg" alt="Bismillah" style={{ maxHeight: '36px', objectFit: 'contain' }} />
              </Box>

              <Text fw={800} size="md" ta="center" c="dark.9" mb="xs">
                {meetingMinute?.title || 'BOARD MEETING MINUTES'}
              </Text>

              <div
                style={{ fontSize: '13px', lineHeight: 1.6, color: '#1e293b' }}
                dangerouslySetInnerHTML={{ __html: meetingMinute?.contentHtml || '<p>No content</p>' }}
              />

              {/* Signatures Preview Strip */}
              <Divider my="md" label="Official Board Signatures Strip" labelPosition="center" />
              <Grid gutter="xs">
                {signatories.map((s) => (
                  <Grid.Col span={{ base: 6, sm: 4, md: 3 }} key={`strip-${s._id || s.name}`}>
                    <Box p="xs" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}>
                      <Text size="10px" fw={700} c="blue.8">{s.role}:</Text>
                      {s.isSigned && s.signatureDataUrl ? (
                        <img src={s.signatureDataUrl} style={{ maxHeight: '32px', margin: '4px auto', display: 'block' }} alt="sig" />
                      ) : (
                        <Text size="10px" c="dimmed" style={{ fontStyle: 'italic', margin: '8px 0' }}>(Pending)</Text>
                      )}
                      <Text size="11px" fw={700} c="dark.8">{s.name}</Text>
                      <Text size="9px" c="dimmed">{s.signDate || ''} {s.signTime || ''}</Text>
                    </Box>
                  </Grid.Col>
                ))}
              </Grid>

              {/* IIPC Footer Banner */}
              <Box mt="lg" ta="center">
                <img src="/letterheads/iipc_footer.jpg" alt="IIPC Footer" style={{ width: '100%', maxHeight: '60px', objectFit: 'contain' }} />
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Finalize, Compile & Dispatch Action Panel */}
        <Paper p="md" withBorder radius="md" style={{ background: 'linear-gradient(135deg, #042f2e 0%, #064e3b 50%, #0f766e 100%)', color: '#ffffff' }}>
          <Stack gap="sm">
            <Group justify="space-between" align="center" wrap="wrap">
              <div>
                <Group gap="xs">
                  <IconMailForward size={22} color="#34d399" />
                  <Text fw={700} size="md" c="#ffffff">
                    Finalize with IIPC Letterhead &amp; Dispatch to Email
                  </Text>
                </Group>
                <Text size="xs" c="#a7f3d0">
                  Compiles Word (.docx) &amp; PDF (.pdf) with official letterhead and sends directly to <strong>info@iipccanada.com</strong> &amp; <strong>accounts@iipccanada.com</strong>.
                </Text>
              </div>

              <Button
                size="md"
                color="teal"
                variant="filled"
                leftSection={<IconSparkles size={18} />}
                onClick={handleFinalizeAndDispatch}
                loading={actionLoading}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                Finalize &amp; Send to info@ and accounts@iipccanada.com
              </Button>
            </Group>

            {/* Generated Downloads if available */}
            {meetingMinute?.docxUrl && (
              <Group justify="space-between" align="center" p="xs" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                <Group gap="xs">
                  <Badge color="green" variant="filled" size="sm">
                    Ready for Download
                  </Badge>
                  <Text size="xs" c="#ffffff">
                    Official Files compiled with IIPC Letterhead and all signatures:
                  </Text>
                </Group>

                <Group gap="xs">
                  <Button
                    size="xs"
                    color="blue"
                    variant="light"
                    leftSection={<IconFileTypeDocx size={14} />}
                    component="a"
                    href={meetingMinute.docxUrl}
                    download
                  >
                    Download Word (.docx)
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    leftSection={<IconFileTypePdf size={14} />}
                    component="a"
                    href={meetingMinute.pdfUrl}
                    download
                  >
                    Download PDF (.pdf)
                  </Button>
                  <Button
                    size="xs"
                    color="gray"
                    variant="light"
                    leftSection={<IconEye size={14} />}
                    onClick={() => {
                      setPreviewPdfUrl(meetingMinute.pdfUrl);
                      setPreviewOpen(true);
                    }}
                  >
                    Preview PDF
                  </Button>
                </Group>
              </Group>
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* MODAL 1: Individual Sign-off Dialog */}
      <Modal
        opened={signingModalOpen}
        onClose={() => setSigningModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="indigo" size="sm" radius="md">
              <IconWriting size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Sign Board Minutes — {activeSignatory?.name} ({activeSignatory?.role})
            </Text>
          </Group>
        }
        size="md"
        centered
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Apply your official digital signature and verify execution date and time.
          </Text>

          <Grid gutter="xs">
            <Grid.Col span={6}>
              <TextInput
                size="xs"
                label="Sign Date"
                type="date"
                value={signDate}
                onChange={(e) => setSignDate(e.target.value)}
                leftSection={<IconCalendar size={14} />}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                size="xs"
                label="Sign Time"
                value={signTime}
                onChange={(e) => setSignTime(e.target.value)}
                leftSection={<IconClock size={14} />}
                placeholder="e.g. 9:00 AM Eastern Time"
              />
            </Grid.Col>
          </Grid>

          {/* Signature Box */}
          <div>
            <Text size="xs" fw={600} mb={4}>
              Signature Graphic:
            </Text>
            <Paper
              p="sm"
              withBorder
              radius="md"
              style={{
                background: '#f8fafc',
                minHeight: '90px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderStyle: 'dashed',
              }}
            >
              {tempSigDataUrl ? (
                <img src={tempSigDataUrl} alt="Signature Preview" style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                  No signature drawn or uploaded yet. Click below to sign.
                </Text>
              )}
            </Paper>

            <Group gap="xs" mt="xs">
              <Button size="xs" color="indigo" variant="light" leftSection={<IconWriting size={14} />} onClick={() => setSigPadOpen(true)}>
                Draw on Screen Pad
              </Button>
              <FileInput
                size="xs"
                placeholder="Upload Sign Image..."
                accept="image/*"
                onChange={(file) => {
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (e) => setTempSigDataUrl(e.target.result);
                  reader.readAsDataURL(file);
                }}
                leftSection={<IconUpload size={14} />}
                style={{ flex: 1 }}
              />
            </Group>
          </div>

          <Group justify="flex-end" mt="md">
            <Button size="xs" variant="default" onClick={() => setSigningModalOpen(false)}>
              Cancel
            </Button>
            <Button size="xs" color="teal" onClick={handleSaveActiveSignature} loading={actionLoading}>
              Confirm &amp; Apply Signature
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Signature Canvas Pad Modal */}
      <SignaturePadModal
        opened={sigPadOpen}
        onClose={() => setSigPadOpen(false)}
        onSaveSignature={(sig) => {
          const url = typeof sig === 'string' ? sig : sig?.dataUrl;
          setTempSigDataUrl(url);
          setSigPadOpen(false);
        }}
      />

      {/* MODAL 2: Edit Meeting Meta */}
      <Modal opened={editMetaModalOpen} onClose={() => setEditMetaModalOpen(false)} title="Edit Meeting Details" size="md" centered>
        <Stack gap="xs">
          <TextInput
            size="xs"
            label="Meeting Title"
            value={metaForm.title}
            onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })}
          />
          <TextInput
            size="xs"
            label="Meeting Date"
            value={metaForm.meetingDate}
            onChange={(e) => setMetaForm({ ...metaForm, meetingDate: e.target.value })}
          />
          <TextInput
            size="xs"
            label="Meeting Time"
            value={metaForm.meetingTime}
            onChange={(e) => setMetaForm({ ...metaForm, meetingTime: e.target.value })}
          />
          <TextInput
            size="xs"
            label="Location"
            value={metaForm.location}
            onChange={(e) => setMetaForm({ ...metaForm, location: e.target.value })}
          />
          <TextInput
            size="xs"
            label="Call to Order"
            value={metaForm.callToOrder}
            onChange={(e) => setMetaForm({ ...metaForm, callToOrder: e.target.value })}
          />
          <Group justify="flex-end" mt="md">
            <Button size="xs" variant="default" onClick={() => setEditMetaModalOpen(false)}>
              Cancel
            </Button>
            <Button size="xs" color="teal" onClick={handleSaveMeta}>
              Save Details
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 3: Add Signatory */}
      <Modal opened={addSigModalOpen} onClose={() => setAddSigModalOpen(false)} title="Add Board Signatory / Officer" size="sm" centered>
        <Stack gap="xs">
          {portalUsers.length > 0 && (
            <Select
              size="xs"
              label="Select from Portal Users"
              placeholder="Pick registered user..."
              data={portalUsers.map((u) => ({ value: u.name, label: `${u.name} (${u.email})` }))}
              onChange={(val) => {
                if (val) setNewSigName(val);
              }}
              clearable
            />
          )}
          <TextInput
            size="xs"
            label="Officer Full Name"
            placeholder="e.g. John Doe"
            value={newSigName}
            onChange={(e) => setNewSigName(e.target.value)}
          />
          <Select
            size="xs"
            label="Role / Title"
            value={newSigRole}
            onChange={setNewSigRole}
            data={[
              { value: 'SECRETARY', label: 'SECRETARY' },
              { value: 'EXECUTIVE DIRECTOR', label: 'EXECUTIVE DIRECTOR' },
              { value: 'MANAGING DIRECTOR', label: 'MANAGING DIRECTOR' },
              { value: 'DIRECTOR', label: 'DIRECTOR' },
              { value: 'TREASURER', label: 'TREASURER' },
              { value: 'PRESIDENT', label: 'PRESIDENT' },
            ]}
          />
          <Group justify="flex-end" mt="md">
            <Button size="xs" variant="default" onClick={() => setAddSigModalOpen(false)}>
              Cancel
            </Button>
            <Button size="xs" color="indigo" onClick={handleAddSignatory}>
              Add Signatory
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 4: PDF Preview */}
      <Modal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={
          <Group gap="xs">
            <IconEye size={18} color="var(--mantine-color-teal-6)" />
            <Text fw={600} size="sm">Board Meeting Minutes — PDF Preview</Text>
          </Group>
        }
        size="xl"
      >
        {previewPdfUrl && (
          <Box style={{ height: '70vh', width: '100%' }}>
            <iframe src={previewPdfUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '6px' }} title="PDF Preview" />
          </Box>
        )}
      </Modal>
    </Card>
  );
}

export default BoardMeetingMinutesCard;
