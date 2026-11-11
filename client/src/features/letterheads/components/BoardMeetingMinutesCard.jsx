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
  Switch,
  Table,
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
  IconCircleMinus,
  IconMail,
  IconCopy,
  IconUserCheck,
  IconLock,
  IconSend,
  IconAlertTriangle,
  IconListCheck,
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

  const roleUpper = (userRole || user?.role || '').toUpperCase();
  const isSuperUser =
    roleUpper === 'SUPER_USER' ||
    roleUpper === 'UNIVERSITY_SUPER_USER' ||
    roleUpper.includes('SUPER') ||
    roleUpper === 'WLS_ADMIN';

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
  const [newSigEmail, setNewSigEmail] = useState('');
  const [newSigRole, setNewSigRole] = useState('DIRECTOR');
  const [newSigAttending, setNewSigAttending] = useState(true);
  const [portalUsers, setPortalUsers] = useState([]);

  // Attendance Manager Modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

  // Standard Mantine Dialogs replacing window.confirm
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [signatoryToDelete, setSignatoryToDelete] = useState(null);

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
    // Load portal users for signatory picker (Super Users only)
    if (isSuperUser) {
      letterheadApi
        .getPortalUsers(userRole)
        .then((res) => {
          if (res?.users) setPortalUsers(res.users);
        })
        .catch((e) => console.warn('Could not load portal users:', e));
    }
  }, [userRole, isSuperUser]);

  // Signatories partitioning based on attendance
  const signatories = meetingMinute?.signatories || [];
  const attendingSignatories = signatories.filter((s) => s.attending !== false);
  const absentSignatories = signatories.filter((s) => s.attending === false);

  const totalSignatories = signatories.length;
  const totalAttending = attendingSignatories.length;
  const signedCount = attendingSignatories.filter((s) => s.isSigned).length;
  const percentSigned = totalAttending > 0 ? Math.round((signedCount / totalAttending) * 100) : 0;
  const allSigned = totalAttending > 0 && signedCount === totalAttending;

  // Toggle single officer attendance
  const handleToggleAttending = async (sigIdOrName, newAttending) => {
    if (!meetingMinute) return;
    try {
      const updatedSigs = signatories.map((s) => {
        if (s._id === sigIdOrName || s.name === sigIdOrName) {
          return { ...s, attending: newAttending };
        }
        return s;
      });

      // Optimistic local update
      setMeetingMinute((prev) => ({ ...prev, signatories: updatedSigs }));

      const res = await letterheadApi.updateMeetingMinutes({
        id: meetingMinute._id,
        data: { signatories: updatedSigs },
        userRole,
      });

      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
      }
    } catch (err) {
      console.error('Toggle attendance error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update attendance status');
      fetchMinutes(); // Rollback
    }
  };

  // Bulk update attendance
  const handleSetAllAttendance = async (markAllAttending = true) => {
    if (!meetingMinute) return;
    try {
      setActionLoading(true);
      const updatedSigs = signatories.map((s) => ({ ...s, attending: markAllAttending }));
      setMeetingMinute((prev) => ({ ...prev, signatories: updatedSigs }));

      const res = await letterheadApi.updateMeetingMinutes({
        id: meetingMinute._id,
        data: { signatories: updatedSigs },
        userRole,
      });

      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
        setSuccessMsg(
          markAllAttending
            ? 'All officers marked as Attending this meeting!'
            : 'All officers marked as Not Attending.'
        );
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

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
        userEmail: user?.email,
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

  // Reset to default template via standard Mantine dialog
  const handleConfirmReset = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await letterheadApi.resetDefaultMeetingMinutes(userRole);
      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
        setResetModalOpen(false);
        setSuccessMsg('Meeting minute reset to default official template!');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Finalize & Dispatch Email to info@ & accounts@iipccanada.com via standard Mantine dialog
  const handleConfirmFinalize = async () => {
    if (!meetingMinute) return;
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
        setFinalizeModalOpen(false);
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
    if (!newSigName.trim()) {
      setError('Officer Name is required');
      return;
    }
    if (!newSigEmail.trim()) {
      setError('Officer Login Email is required');
      return;
    }
    if (!meetingMinute) return;

    try {
      setActionLoading(true);
      const updatedSigs = [
        ...signatories,
        {
          name: newSigName.trim().toUpperCase(),
          email: newSigEmail.trim().toLowerCase(),
          role: newSigRole.toUpperCase(),
          attending: newSigAttending,
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
        setNewSigEmail('');
        setNewSigAttending(true);
        setAddSigModalOpen(false);
        setSuccessMsg(`Officer ${newSigName} added successfully!`);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete signatory via standard Mantine dialog
  const handleConfirmDeleteSignatory = async () => {
    if (!signatoryToDelete || !meetingMinute) return;
    try {
      setActionLoading(true);
      const updatedSigs = signatories.filter((s) => s._id !== signatoryToDelete._id && s.name !== signatoryToDelete.name);
      const res = await letterheadApi.updateMeetingMinutes({
        id: meetingMinute._id,
        data: { signatories: updatedSigs },
        userRole,
      });
      if (res?.meetingMinute) {
        setMeetingMinute(res.meetingMinute);
        setDeleteModalOpen(false);
        setSignatoryToDelete(null);
        setSuccessMsg(`Officer ${signatoryToDelete.name} removed from list.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Copy Direct Link for Board Members
  const handleCopyDirectLink = () => {
    const url = window.location.origin + '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    navigator.clipboard?.writeText(url);
    setSuccessMsg('Sign-off portal link copied to clipboard! Share with directors to sign.');
  };

  if (loading) {
    return (
      <Paper p="xl" withBorder radius="md" style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible={true} />
        <Text size="sm" c="dimmed" ta="center">Loading official Board Meeting Minutes...</Text>
      </Paper>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ position: 'relative' }}>
      <LoadingOverlay visible={actionLoading} />

      <Stack gap="md">
        {/* Header with Title & Badges */}
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Group gap="xs">
              <ThemeIcon color="teal" size="lg" radius="md">
                <IconUsersGroup size={20} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="md" c="dark.9">
                  Board Meeting Minutes &amp; Director Signatures
                </Text>
                <Text size="xs" c="dimmed">
                  IIPC Canada Official Board Minutes &bull; Multi-Director Sign-off &bull; Auto-Email to info@ &amp; accounts@iipccanada.com
                </Text>
              </div>
            </Group>
          </div>

          <Group gap="xs">
            <Badge color="teal" variant="light" size="sm" leftSection={<IconBuildingBank size={12} />}>
              IIPC LETTERHEAD
            </Badge>
            {allSigned ? (
              <Badge color="green" variant="filled" size="sm" leftSection={<IconCheck size={12} />}>
                ALL {totalAttending} SIGNED
              </Badge>
            ) : (
              <Badge color="orange" variant="light" size="sm" leftSection={<IconClock size={12} />}>
                {signedCount} OF {totalAttending} SIGNED
              </Badge>
            )}
            {meetingMinute?.emailDispatched && (
              <Badge color="blue" variant="filled" size="sm" leftSection={<IconMailForward size={12} />}>
                DISPATCHED
              </Badge>
            )}
          </Group>
        </Group>

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
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="xs" wrap="wrap">
                <Text size="xs" fw={700} c="teal.9">
                  Board Sign-off Progress:
                </Text>
                <Text size="xs" fw={600} c="dark.7">
                  {signedCount} of {totalAttending} Attending Directors / Officers Signed ({percentSigned}%)
                </Text>
                {absentSignatories.length > 0 && (
                  <Badge size="xs" color="gray" variant="outline">
                    {absentSignatories.length} Absent / Excused from this Meeting
                  </Badge>
                )}
              </Group>

              <Group gap="xs">
                <Button
                  size="compact-xs"
                  variant="light"
                  color="indigo"
                  leftSection={<IconCopy size={12} />}
                  onClick={handleCopyDirectLink}
                  title="Copy direct link for board members to log in and sign"
                >
                  Copy Sign-off Link
                </Button>
                {isSuperUser && (
                  <>
                    <Button
                      size="compact-xs"
                      variant="light"
                      color="cyan"
                      leftSection={<IconListCheck size={12} />}
                      onClick={() => setAttendanceModalOpen(true)}
                      title="Manage which directors are attending vs absent for this meeting"
                    >
                      Attendance Roster ({totalAttending}/{totalSignatories})
                    </Button>
                    <Button size="compact-xs" variant="light" color="teal" leftSection={<IconEdit size={12} />} onClick={() => setEditMetaModalOpen(true)}>
                      Edit Details
                    </Button>
                    <Button size="compact-xs" variant="light" color="indigo" leftSection={<IconPlus size={12} />} onClick={() => setAddSigModalOpen(true)}>
                      Add Signatory
                    </Button>
                    <Button size="compact-xs" variant="subtle" color="gray" leftSection={<IconRefresh size={12} />} onClick={() => setResetModalOpen(true)}>
                      Reset to Template
                    </Button>
                  </>
                )}
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
                {totalSignatories} Listed Officers
              </Badge>
              <Badge size="xs" color="teal" variant="light">
                {totalAttending} Attending
              </Badge>
              {absentSignatories.length > 0 && (
                <Badge size="xs" color="gray" variant="light">
                  {absentSignatories.length} Absent / Excluded
                </Badge>
              )}
            </Group>
            <Text size="11px" c="dimmed">
              Use the toggle switch to mark attending vs absent officers for this meeting. Absent officers are excluded from sign-off.
            </Text>
          </Group>

          <Grid gutter="sm">
            {signatories.map((sig) => {
              const isAttending = sig.attending !== false;
              const userEmail = (user?.email || '').toLowerCase().trim();
              const sigEmail = (sig.email || '').toLowerCase().trim();
              const userName = (user?.name || '').toLowerCase().trim();
              const isCurrentLoggedUser =
                (userEmail && sigEmail && userEmail === sigEmail) ||
                (userName && sig.name && userName.includes(sig.name.split(' ')[0].toLowerCase()));

              const canSignThis = isSuperUser || isCurrentLoggedUser;

              return (
                <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3.4 }} key={sig._id || sig.name}>
                  <Paper
                    p="sm"
                    withBorder
                    radius="md"
                    style={{
                      background: !isAttending
                        ? '#f8fafc'
                        : sig.isSigned
                        ? '#f0fdf4'
                        : isCurrentLoggedUser
                        ? '#f5f3ff'
                        : '#ffffff',
                      borderColor: !isAttending
                        ? '#cbd5e1'
                        : sig.isSigned
                        ? '#86efac'
                        : isCurrentLoggedUser
                        ? '#6366f1'
                        : '#e2e8f0',
                      borderWidth: isCurrentLoggedUser && isAttending ? '2px' : '1px',
                      borderStyle: !isAttending ? 'dashed' : 'solid',
                      opacity: !isAttending ? 0.85 : 1,
                      transition: 'all 0.2s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isCurrentLoggedUser && isAttending ? '0 6px 20px rgba(99, 102, 241, 0.22)' : 'none',
                    }}
                  >
                    <div>
                      <Group justify="space-between" align="flex-start" mb={4}>
                        <Badge
                          size="xs"
                          variant={isAttending ? 'filled' : 'outline'}
                          color={
                            !isAttending
                              ? 'gray'
                              : sig.role.includes('SECRETARY')
                              ? 'teal'
                              : sig.role.includes('EXECUTIVE')
                              ? 'grape'
                              : sig.role.includes('MANAGING')
                              ? 'blue'
                              : sig.role.includes('CHAIRMAN')
                              ? 'red'
                              : 'indigo'
                          }
                        >
                          {sig.role}
                        </Badge>
                        <Group gap={6} align="center">
                          {isCurrentLoggedUser && isAttending && (
                            <Badge color="indigo" size="xs" variant="light" leftSection={<IconUserCheck size={10} />}>
                              Your Box
                            </Badge>
                          )}
                          {!isAttending ? (
                            <Badge color="gray" size="xs" variant="light" leftSection={<IconCircleMinus size={10} />}>
                              Not in Meeting
                            </Badge>
                          ) : sig.isSigned ? (
                            <Badge color="green" size="xs" variant="light" leftSection={<IconCheck size={10} />}>
                              Signed
                            </Badge>
                          ) : (
                            <Badge color="orange" size="xs" variant="light" leftSection={<IconClock size={10} />}>
                              Pending
                            </Badge>
                          )}
                          {isSuperUser && (
                            <ActionIcon
                              size="xs"
                              color="gray"
                              variant="subtle"
                              onClick={() => {
                                setSignatoryToDelete(sig);
                                setDeleteModalOpen(true);
                              }}
                              title="Remove Officer"
                            >
                              <IconTrash size={12} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Group>

                      {/* Super User Attendance Toggle switch */}
                      {isSuperUser && (
                        <Group justify="space-between" align="center" my={4} p={4} style={{ background: isAttending ? '#f0fdfa' : '#f1f5f9', borderRadius: '4px' }}>
                          <Text size="11px" fw={600} c={isAttending ? 'teal.8' : 'dimmed'}>
                            {isAttending ? 'Attending Meeting' : 'Absent (Excluded)'}
                          </Text>
                          <Tooltip label={isAttending ? "Toggle OFF if this officer is absent (their signature will not be required)" : "Toggle ON to include this officer in the meeting sign-off"}>
                            <Switch
                              size="xs"
                              color="teal"
                              checked={isAttending}
                              onChange={(e) => handleToggleAttending(sig._id || sig.name, e.currentTarget.checked)}
                            />
                          </Tooltip>
                        </Group>
                      )}

                      <Text fw={700} size="sm" c={isAttending ? 'dark.9' : 'dimmed'} mt={2}>
                        {sig.name}
                      </Text>

                      {/* Display Officer Email */}
                      <Group gap={4} mt={2}>
                        <IconMail size={12} color="#64748b" />
                        <Text size="11px" c="dimmed" truncate style={{ maxWidth: '190px' }}>
                          {sig.email || 'No email assigned'}
                        </Text>
                      </Group>

                      {/* Signature Box Area */}
                      <Box
                        mt="xs"
                        p="xs"
                        style={{
                          background: !isAttending ? '#f1f5f9' : '#ffffff',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '6px',
                          minHeight: '62px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!isAttending ? (
                          <Text size="11px" c="dimmed" style={{ fontStyle: 'italic', textAlign: 'center' }}>
                            (Absent from this meeting &bull; Signature not required)
                          </Text>
                        ) : sig.isSigned && sig.signatureDataUrl ? (
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
                        <strong>Date:</strong> {sig.signDate || (isAttending ? 'Not set' : 'N/A')}
                      </Text>
                      <Text size="11px" c="dimmed">
                        <strong>Time:</strong> {sig.signTime || (isAttending ? 'Not set' : 'N/A')}
                      </Text>
                    </div>

                    {!isAttending ? (
                      <Button size="xs" variant="light" color="gray" disabled fullWidth mt="xs">
                        Excluded from Meeting Sign-off
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant={sig.isSigned ? 'light' : 'filled'}
                        color={sig.isSigned ? 'teal' : isCurrentLoggedUser ? 'indigo' : 'blue'}
                        fullWidth
                        leftSection={<IconWriting size={14} />}
                        disabled={!canSignThis}
                        onClick={() => handleOpenSignModal(sig)}
                        mt="xs"
                      >
                        {sig.isSigned ? 'Update / Re-sign' : isCurrentLoggedUser ? 'Sign as Yourself' : 'Sign as Officer'}
                      </Button>
                    )}
                  </Paper>
                </Grid.Col>
              );
            })}
          </Grid>
        </div>

        {/* Content Viewer / Upload Replacement Word Document */}
        <Paper p="md" withBorder radius="md" style={{ background: '#ffffff' }}>
          <Stack gap="sm">
            <Group justify="space-between" align="center" wrap="wrap">
              <div>
                <Text fw={700} size="sm" c="dark.8">
                  Official Meeting Minutes Document Preview (With IIPC Canada Letterhead)
                </Text>
                <Text size="xs" c="dimmed">
                  This document content will be merged with the official IIPC Letterhead and signatures upon finalization.
                </Text>
              </div>

              {isSuperUser && (
                <Group gap="xs">
                  <FileInput
                    placeholder="Replace with custom .docx..."
                    size="xs"
                    accept=".docx"
                    value={uploadDocx}
                    onChange={handleUploadDocxChange}
                    leftSection={<IconUpload size={14} />}
                    loading={uploadingDocx}
                    style={{ width: '220px' }}
                  />
                  {meetingMinute?.uploadedDocxName && (
                    <Badge color="indigo" size="xs" variant="light">
                      Custom: {meetingMinute.uploadedDocxName}
                    </Badge>
                  )}
                </Group>
              )}
            </Group>

            {/* Document Sheet Simulation */}
            <Box
              p="xl"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                maxWidth: '820px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              {/* IIPC Header Banner */}
              <Box mb="md" ta="center">
                <img src="/letterheads/iipc_header.jpg" alt="IIPC Header" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain' }} />
              </Box>

              <Box mb="md" ta="center">
                <img src="/letterheads/iipc_bismillah.jpg" alt="Bismillah" style={{ maxHeight: '38px', objectFit: 'contain' }} />
              </Box>

              <Text ta="center" fw={800} size="md" c="dark.9" mb="xs">
                {meetingMinute?.title || 'BOARD MEETING MINUTES'}
              </Text>

              <div
                style={{ fontSize: '13px', lineHeight: 1.6, color: '#1e293b' }}
                dangerouslySetInnerHTML={{ __html: meetingMinute?.contentHtml || '<p>No content</p>' }}
              />

              {/* Signatures Preview Strip */}
              <Divider my="md" label="Attending Board Signatures Strip" labelPosition="center" />
              <Grid gutter="xs">
                {attendingSignatories.map((s) => (
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

              {absentSignatories.length > 0 && (
                <Text size="11px" c="dimmed" mt="xs" ta="center" style={{ fontStyle: 'italic' }}>
                  Officers Excused / Not Attending: {absentSignatories.map((s) => `${s.name} (${s.role})`).join(', ')}
                </Text>
              )}

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

              {isSuperUser ? (
                <Button
                  size="md"
                  color="teal"
                  variant="filled"
                  leftSection={<IconSparkles size={18} />}
                  onClick={() => setFinalizeModalOpen(true)}
                  loading={actionLoading}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  Finalize &amp; Send to info@ and accounts@iipccanada.com
                </Button>
              ) : (
                <Badge color="yellow" variant="filled" size="md">
                  Awaiting Super Admin Dispatch
                </Badge>
              )}
            </Group>

            {/* Generated Downloads if available */}
            {meetingMinute?.docxUrl && (
              <Group justify="space-between" align="center" p="xs" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                <Group gap="xs">
                  <Badge color="green" variant="filled" size="sm">
                    Ready for Download
                  </Badge>
                  <Text size="xs" c="#ffffff">
                    Official Files compiled with IIPC Letterhead and signatures:
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
      <Modal
        opened={addSigModalOpen}
        onClose={() => setAddSigModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="indigo" size="sm" radius="md">
              <IconPlus size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Add Board Signatory / Officer
            </Text>
          </Group>
        }
        size="md"
        centered
      >
        <Stack gap="xs">
          <Text size="xs" c="dimmed">
            Pick a registered user from the database or enter custom officer info. You can also choose whether they are attending this meeting.
          </Text>

          {portalUsers.length > 0 && (
            <Select
              size="xs"
              label="Choose from Registered Portal Users (Auto-fills Name & Email)"
              placeholder="Search user by name or email..."
              searchable
              clearable
              data={portalUsers.map((u) => ({
                value: u.email,
                label: `${u.name} — ${u.email} (${u.role})`,
              }))}
              onChange={(val) => {
                if (val) {
                  const sel = portalUsers.find((u) => u.email === val);
                  if (sel) {
                    setNewSigName(sel.name);
                    setNewSigEmail(sel.email);
                  }
                }
              }}
            />
          )}

          <TextInput
            size="xs"
            label="Officer Full Name"
            placeholder="e.g. FAWAD GILANI"
            required
            value={newSigName}
            onChange={(e) => setNewSigName(e.target.value)}
          />

          <TextInput
            size="xs"
            label="Officer Portal Email (Login Email)"
            placeholder="e.g. fawadgilani@iipccanada.com"
            required
            description="The officer logs in with this email to access and apply their signature."
            leftSection={<IconMail size={14} />}
            value={newSigEmail}
            onChange={(e) => setNewSigEmail(e.target.value)}
          />

          <Select
            size="xs"
            label="Role / Board Title (Chosen by Super User)"
            value={newSigRole}
            onChange={setNewSigRole}
            data={[
              { value: 'SECRETARY', label: 'SECRETARY' },
              { value: 'EXECUTIVE DIRECTOR', label: 'EXECUTIVE DIRECTOR' },
              { value: 'MANAGING DIRECTOR', label: 'MANAGING DIRECTOR' },
              { value: 'DIRECTOR', label: 'DIRECTOR' },
              { value: 'CHAIRMAN', label: 'CHAIRMAN' },
              { value: 'PRESIDENT', label: 'PRESIDENT' },
              { value: 'VICE PRESIDENT', label: 'VICE PRESIDENT' },
              { value: 'TREASURER', label: 'TREASURER' },
              { value: 'BOARD MEMBER', label: 'BOARD MEMBER' },
              { value: 'LEGAL COUNSEL', label: 'LEGAL COUNSEL' },
              { value: 'AUDITOR / OBSERVER', label: 'AUDITOR / OBSERVER' },
            ]}
          />

          <Paper p="xs" withBorder radius="md" style={{ background: '#f8fafc' }} mt="xs">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" fw={600}>Attending this Meeting</Text>
                <Text size="11px" c="dimmed">If enabled, signature will be required for this meeting.</Text>
              </div>
              <Switch
                color="teal"
                checked={newSigAttending}
                onChange={(e) => setNewSigAttending(e.currentTarget.checked)}
              />
            </Group>
          </Paper>

          <Group justify="flex-end" mt="md">
            <Button size="xs" variant="default" onClick={() => setAddSigModalOpen(false)}>
              Cancel
            </Button>
            <Button size="xs" color="indigo" onClick={handleAddSignatory} loading={actionLoading}>
              Add Officer
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 4: Attendance Roster Manager */}
      <Modal
        opened={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="cyan" size="sm" radius="md">
              <IconListCheck size={16} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Board Meeting Attendance Roster
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Toggle which officers attended this meeting. Officers marked as <strong>Not Attending</strong> are excluded from signature requirements and will not appear in the signed final document.
          </Text>

          <Group justify="space-between" align="center">
            <Badge color="cyan" size="sm" variant="light">
              {totalAttending} Present &bull; {absentSignatories.length} Absent
            </Badge>

            <Group gap="xs">
              <Button size="compact-xs" variant="light" color="teal" onClick={() => handleSetAllAttendance(true)}>
                Mark All Present
              </Button>
              <Button size="compact-xs" variant="subtle" color="gray" onClick={() => handleSetAllAttendance(false)}>
                Clear All
              </Button>
            </Group>
          </Group>

          <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <Table striped highlightOnHover verticalSpacing="xs">
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th style={{ width: '40px' }}>#</Table.Th>
                  <Table.Th>Officer Name &amp; Title</Table.Th>
                  <Table.Th>Login Email</Table.Th>
                  <Table.Th style={{ width: '90px', textAlign: 'center' }}>Sign Status</Table.Th>
                  <Table.Th style={{ width: '130px', textAlign: 'center' }}>Meeting Attendance</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {signatories.map((sig, idx) => {
                  const isAttending = sig.attending !== false;
                  return (
                    <Table.Tr key={sig._id || sig.name}>
                      <Table.Td>{idx + 1}</Table.Td>
                      <Table.Td>
                        <Text size="xs" fw={700} c={isAttending ? 'dark.9' : 'dimmed'}>{sig.name}</Text>
                        <Badge size="xs" variant="light" color="blue">{sig.role}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">{sig.email || '—'}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        {sig.isSigned ? (
                          <Badge color="green" size="xs" variant="light">Signed</Badge>
                        ) : (
                          <Badge color="orange" size="xs" variant="light">Pending</Badge>
                        )}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Switch
                          size="xs"
                          color="teal"
                          checked={isAttending}
                          onChange={(e) => handleToggleAttending(sig._id || sig.name, e.currentTarget.checked)}
                          label={isAttending ? 'Attending' : 'Absent'}
                          styles={{ label: { fontSize: '11px', fontWeight: 600, color: isAttending ? '#0d9488' : '#94a3b8' } }}
                        />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>

          <Group justify="flex-end" mt="xs">
            <Button size="xs" color="teal" onClick={() => setAttendanceModalOpen(false)}>
              Done
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 5: Standard Mantine Dialog for Finalize & Dispatch (Replacing window.confirm) */}
      <Modal
        opened={finalizeModalOpen}
        onClose={() => !actionLoading && setFinalizeModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="teal" size="md" radius="md">
              <IconSend size={18} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Finalize &amp; Dispatch Board Meeting Minutes
            </Text>
          </Group>
        }
        size="lg"
        centered
        radius="md"
      >
        <Stack gap="md">
          <Alert color="teal" icon={<IconShieldCheck size={18} />} radius="md">
            You are about to generate official, ratified Board Meeting Minutes with the IIPC Canada Letterhead and verified director signatures, and dispatch them via email.
          </Alert>

          {/* Details Summary */}
          <Paper p="sm" withBorder radius="md" style={{ background: '#f8fafc' }}>
            <Grid gutter="xs">
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Title:</Text>
                <Text size="xs" fw={700}>{meetingMinute?.title}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Date &amp; Time:</Text>
                <Text size="xs" fw={700}>{meetingMinute?.meetingDate} &bull; {meetingMinute?.meetingTime}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Location:</Text>
                <Text size="xs" fw={600}>{meetingMinute?.location || 'Online- Zoom'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Call to Order:</Text>
                <Text size="xs" fw={600}>{meetingMinute?.callToOrder}</Text>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Signatories Roster in Document */}
          <div>
            <Text size="xs" fw={700} c="dark.8" mb={4}>
              Attending Officers to be Included on Document ({attendingSignatories.length}):
            </Text>
            <Paper p="xs" withBorder radius="md">
              <Grid gutter="xs">
                {attendingSignatories.map((s) => (
                  <Grid.Col span={6} key={s._id || s.name}>
                    <Group justify="space-between">
                      <Text size="xs" fw={600}>{s.name} ({s.role})</Text>
                      {s.isSigned ? (
                        <Badge size="xs" color="green" variant="light" leftSection={<IconCheck size={10} />}>Signed</Badge>
                      ) : (
                        <Badge size="xs" color="orange" variant="light" leftSection={<IconClock size={10} />}>Pending</Badge>
                      )}
                    </Group>
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>
          </div>

          {absentSignatories.length > 0 && (
            <div>
              <Text size="xs" fw={700} c="dimmed" mb={4}>
                Absent / Excused Officers (Excluded from Sign-off):
              </Text>
              <Group gap={6}>
                {absentSignatories.map((s) => (
                  <Badge key={s._id || s.name} size="xs" color="gray" variant="light">
                    {s.name} ({s.role})
                  </Badge>
                ))}
              </Group>
            </div>
          )}

          {/* Email Recipients */}
          <Paper p="xs" withBorder radius="md" style={{ background: '#f0fdfa', borderColor: '#ccfbf1' }}>
            <Group justify="space-between">
              <div>
                <Text size="xs" fw={700} c="teal.9">Official Email Recipients:</Text>
                <Text size="xs" c="teal.8">info@iipccanada.com, accounts@iipccanada.com</Text>
              </div>
              <Badge color="teal" size="sm" variant="filled">
                2 Recipients
              </Badge>
            </Group>
          </Paper>

          {/* Warning if some attending officers have not signed */}
          {!allSigned && (
            <Alert color="orange" icon={<IconAlertTriangle size={18} />} radius="md">
              <strong>Notice:</strong> {totalAttending - signedCount} attending officer(s) have not signed yet. If you proceed now, their signature boxes will display as pending on the official minutes.
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" onClick={() => setFinalizeModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              color="teal"
              size="xs"
              variant="filled"
              leftSection={<IconSend size={15} />}
              onClick={handleConfirmFinalize}
              loading={actionLoading}
            >
              Confirm &amp; Dispatch Document
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 6: Reset Default Template Dialog */}
      <Modal
        opened={resetModalOpen}
        onClose={() => !actionLoading && setResetModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="orange" size="sm" radius="md">
              <IconRefresh size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">Reset Meeting Minutes Template</Text>
          </Group>
        }
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Are you sure you want to reset this meeting minute to the official IIPC Canada 2026 3rd Quarter default template? Any unsaved edits will be restored.
          </Text>
          <Group justify="flex-end">
            <Button size="xs" variant="default" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button size="xs" color="orange" onClick={handleConfirmReset} loading={actionLoading}>
              Reset to Template
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 7: Delete Officer Confirmation Dialog */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => !actionLoading && setDeleteModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="red" size="sm" radius="md">
              <IconTrash size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">Remove Board Signatory</Text>
          </Group>
        }
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Remove <strong>{signatoryToDelete?.name}</strong> ({signatoryToDelete?.role}) from the board minutes roster?
          </Text>
          <Group justify="flex-end">
            <Button size="xs" variant="default" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button size="xs" color="red" onClick={handleConfirmDeleteSignatory} loading={actionLoading}>
              Remove Officer
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 8: PDF Preview */}
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
