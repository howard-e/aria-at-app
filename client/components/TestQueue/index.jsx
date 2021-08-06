import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Container, Table, Alert } from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import nextId from 'react-id-generator';
import TestQueueRun from '../TestQueueRun';
import {
    NewTestPlanReportContainer,
    NewTestPlanReportModal
} from '../NewTestPlanReport';
import DeleteTestPlanReportModal from '../DeleteTestPlanReportModal';
import DeleteResultsModal from '../DeleteResultsModal';
import { TEST_QUEUE_PAGE_QUERY } from './queries';
import './TestQueue.css';

const TestQueue = ({ auth }) => {
    const { loading, data, refetch } = useQuery(TEST_QUEUE_PAGE_QUERY);

    const [testers, setTesters] = useState([]);
    const [testPlanReports, setTestPlanReports] = useState([]);
    const [structuredTestPlanTargets, setStructuredTestPlanTargets] = useState(
        {}
    );
    const [
        deleteTestPlanReportDetails,
        setDeleteTestPlanReportDetails
    ] = useState({});
    const [
        isShowingDeleteTestPlanReportModal,
        setDeleteTestPlanReportModal
    ] = useState(false);
    const [deleteResultsDetails, setDeleteResultsDetails] = useState({});
    const [isShowingDeleteResultsModal, setDeleteResultsModal] = useState(
        false
    );
    const [isShowingAddToQueueModal, setAddToQueueModal] = useState(false);

    const { isAdmin } = auth;

    useEffect(() => {
        if (data) {
            const { users = [], testPlanReports = [] } = data;
            setTesters(
                users.filter(
                    tester =>
                        tester.roles.includes('TESTER') ||
                        tester.roles.includes('ADMIN')
                )
            );
            setTestPlanReports(testPlanReports);
        }
    }, [data]);

    useEffect(() => {
        const structuredTestPlanTargets = generateStructuredTestPlanVersions(
            testPlanReports
        );
        setStructuredTestPlanTargets(structuredTestPlanTargets);
    }, [testPlanReports]);

    const generateStructuredTestPlanVersions = testPlanReports => {
        const structuredData = {};

        // get all testPlanTargets grouped to make it easier to drop into TestQueue table
        testPlanReports.forEach(testPlanReport => {
            if (!structuredData[testPlanReport.testPlanTarget.title]) {
                structuredData[testPlanReport.testPlanTarget.title] = [
                    testPlanReport
                ];
            } else {
                structuredData[testPlanReport.testPlanTarget.title].push(
                    testPlanReport
                );
            }
        });

        return structuredData;
    };

    const renderAtBrowserList = (title = '', testPlanReports = []) => {
        // means structuredTestPlanTargets would have been generated
        if (!testPlanReports.length) return null;

        const tableId = nextId('table_name_');

        return (
            <div key={title}>
                <h2 id={tableId}>{title}</h2>
                <Table
                    className="test-queue"
                    aria-labelledby={tableId}
                    striped
                    bordered
                    hover
                >
                    <thead>
                        <tr>
                            <th className="test-plan">Test Plan</th>
                            <th className="testers">Testers</th>
                            <th className="report-status">Report Status</th>
                            <th className="actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {testPlanReports.map(testPlanReport => {
                            const key = `test_plan_report_${testPlanReport.id}`;
                            return (
                                <TestQueueRun
                                    key={key}
                                    user={auth}
                                    testers={testers}
                                    testPlanReport={testPlanReport}
                                    triggerDeleteTestPlanReportModal={
                                        triggerDeleteTestPlanReportModal
                                    }
                                    triggerDeleteResultsModal={
                                        triggerDeleteResultsModal
                                    }
                                    triggerTestPlanReportUpdate={refetch}
                                />
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        );
    };

    const triggerDeleteTestPlanReportModal = (
        id = null,
        title = null,
        deleteFunction = () => {}
    ) => {
        setDeleteTestPlanReportDetails({ id, title, deleteFunction });
        setDeleteTestPlanReportModal(true);
    };

    const handleDeleteTestPlanReport = async () => {
        if (deleteTestPlanReportDetails.deleteFunction)
            await deleteTestPlanReportDetails.deleteFunction();
        handleCloseDeleteTestPlanReportModal();
    };

    const handleCloseDeleteTestPlanReportModal = () => {
        setDeleteTestPlanReportModal(false);

        // reset deleteTestPlanDetails
        setDeleteTestPlanReportDetails({});
    };

    const triggerDeleteResultsModal = (
        title = null,
        username = null,
        deleteFunction = () => {}
    ) => {
        setDeleteResultsDetails({
            title,
            username,
            deleteFunction
        });
        setDeleteResultsModal(true);
    };

    const handleDeleteResults = async () => {
        if (deleteResultsDetails.deleteFunction)
            await deleteResultsDetails.deleteFunction();
        handleCloseDeleteResultsModal();
    };

    const handleCloseDeleteResultsModal = () => {
        setDeleteResultsModal(false);

        // reset deleteResultsDetails
        setDeleteResultsDetails({});
    };

    const handleCloseAddTestPlanToQueueModal = () => setAddToQueueModal(false);

    if (loading) {
        return (
            <Container as="main">
                <Helmet>
                    <title>{`Loading - Test Queue | ARIA-AT`}</title>
                </Helmet>
                <h1>Test Queue</h1>

                <div data-testid="test-queue-loading">Loading ...</div>
            </Container>
        );
    }

    if (!testPlanReports.length) {
        const noTestPlansMessage = 'There are no Test Plans available';
        const settingsLink = <Link to="/account/settings">Settings</Link>;

        return (
            <Container as="main">
                <Helmet>
                    <title>{noTestPlansMessage} | ARIA-AT</title>
                </Helmet>
                <h2 data-testid="test-queue-no-test-plans-h2">
                    {noTestPlansMessage}
                </h2>
                <Alert
                    key="alert-configure"
                    variant="danger"
                    data-testid="test-queue-no-test-plans-p"
                >
                    {!isAdmin
                        ? `Please configure your preferred Assistive Technologies in
                    the ${settingsLink} page.`
                        : 'Add a Test Plan to the Queue'}
                </Alert>

                {isAdmin && (
                    <NewTestPlanReportContainer
                        handleOpenDialog={() => setAddToQueueModal(true)}
                    />
                )}

                {isAdmin && isShowingAddToQueueModal && (
                    <NewTestPlanReportModal
                        show={isShowingAddToQueueModal}
                        handleClose={handleCloseAddTestPlanToQueueModal}
                        handleAddToTestQueue={refetch}
                    />
                )}
            </Container>
        );
    }

    return (
        <Container as="main">
            <Helmet>
                <title>{`Test Queue | ARIA-AT`}</title>
            </Helmet>
            <h1>Test Queue</h1>
            <p data-testid="test-queue-instructions">
                Assign yourself a test plan or start executing one that is
                already assigned to you.
            </p>

            {isAdmin && (
                <NewTestPlanReportContainer
                    handleOpenDialog={() => setAddToQueueModal(true)}
                />
            )}

            {Object.keys(structuredTestPlanTargets).map(key =>
                renderAtBrowserList(key, structuredTestPlanTargets[key])
            )}

            <DeleteResultsModal
                show={isShowingDeleteResultsModal}
                isAdmin={isAdmin}
                details={deleteResultsDetails}
                handleClose={handleCloseDeleteResultsModal}
                handleAction={handleDeleteResults}
            />

            {isAdmin && isShowingDeleteTestPlanReportModal && (
                <DeleteTestPlanReportModal
                    show={isShowingDeleteTestPlanReportModal}
                    details={deleteTestPlanReportDetails}
                    handleClose={handleCloseDeleteTestPlanReportModal}
                    handleAction={handleDeleteTestPlanReport}
                />
            )}

            {isAdmin && isShowingAddToQueueModal && (
                <NewTestPlanReportModal
                    show={isShowingAddToQueueModal}
                    handleClose={handleCloseAddTestPlanToQueueModal}
                    handleAddToTestQueue={refetch}
                />
            )}
        </Container>
    );
};

TestQueue.propTypes = {
    auth: PropTypes.object
};

const mapStateToProps = state => {
    const { auth } = state;
    return { auth };
};

export default connect(mapStateToProps)(TestQueue);
