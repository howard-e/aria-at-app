import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { getTestSuiteVersions, saveCycle } from '../../actions/cycles';
import { getAllUsers } from '../../actions/users';
import ConfigureTechnologyRow from '@components/ConfigureTechnologyRow';
import ConfigureRunsForExample from '@components/ConfigureRunsForExample';

class InitiateCycle extends Component {
    constructor(props) {
        super(props);
        const { testSuiteVersions } = props;
        this.state = {
            selectedVersion: testSuiteVersions.length
                ? testSuiteVersions[0].id
                : undefined,
            name: '',
            runTechnologyRows: [{}],
            runTestersByExample: {} // example_id: runTechnolgiesIndex: [userlist]
        };

        /*
         * at_version,
         * browser_version,
         * at_id,
         * browser_id,
         * apg_example_id,
         * users: [user_id, user_id]
         */

        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleTechnologyRowChange = this.handleTechnologyRowChange.bind(
            this
        );
        this.addTechnologyRow = this.addTechnologyRow.bind(this);
        this.assignTesters = this.assignTesters.bind(this);
        this.removeAllTestersFromRun = this.removeAllTestersFromRun.bind(this);
        this.initiateCycle = this.initiateCycle.bind(this);
    }

    componentDidMount() {
        const { dispatch, testSuiteVersions, users } = this.props;

        if (!testSuiteVersions.length) {
            dispatch(getTestSuiteVersions());
        }
        if (!users.length) {
            dispatch(getAllUsers());
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        // When we get the testSuiteVersions list for the first time, the application automatically
        // selected the most recent version
        if (
            prevState.selectedVersion === undefined &&
            nextProps.testSuiteVersions.length > 0
        ) {
            return {
                selectedVersion: nextProps.testSuiteVersions[0].id
            };
        }
        return null;
    }

    initiateCycle() {
        const { dispatch, testSuiteVersions, history } = this.props;
        let versionData = testSuiteVersions.filter(
            version => version.id === this.state.selectedVersion
        )[0];

        let cycle = {
            name: this.state.name,
            test_version_id: this.state.selectedVersion,
            created_user_id: 1
        };

        // TODO: Do not allow saving of cycle without a name. Put focus on name field

        const runs = [];
        for (
            let index = 0;
            index < this.state.runTechnologyRows.length;
            index++
        ) {
            const runTechnologyPair = this.state.runTechnologyRows[index];

            if (
                !runTechnologyPair.at_id ||
                !runTechnologyPair.at_version ||
                !runTechnologyPair.browser_id ||
                !runTechnologyPair.browser_version
            ) {
                // TODO: if one of these fields is not filled out, put focus on field
                // TODO: if ALL of these fields are blank, ignore it
                continue;
            }

            for (let example of versionData.apg_examples) {
                let runTestersByTechIndex = this.state.runTestersByExample[
                    example.id
                ];

                runs.push({
                    ...runTechnologyPair,
                    apg_example_id: example.id,
                    users:
                        runTestersByTechIndex && runTestersByTechIndex[index]
                            ? runTestersByTechIndex[index]
                            : []
                });
            }
        }

        cycle.runs = runs;
        dispatch(saveCycle(cycle));

        history.push('/cycles');
    }

    assignTesters(exampleId, runTechnologyIndexes, userId) {
        const { users, testSuiteVersions } = this.props;

        let atIdToNameId = {};
        let supportedAts = testSuiteVersions.filter(
            version => version.id === this.state.selectedVersion
        )[0].supported_ats;
        for (let at of supportedAts) {
            atIdToNameId[at.at_id] = at.at_name_id;
        }

        let user = users.filter(u => u.id === userId)[0];
        let atNameIdsForUser = user.configured_ats.map(a => a.at_name_id);

        let newRunTestersByExample = { ...this.state.runTestersByExample };
        let newRunTestersByTechIndex = {
            ...this.state.runTestersByExample[exampleId]
        };

        for (let technologyIndex of runTechnologyIndexes) {
            let nameId =
                atIdToNameId[
                    this.state.runTechnologyRows[technologyIndex].at_id
                ];
            if (atNameIdsForUser.indexOf(nameId) >= 0) {
                if (newRunTestersByTechIndex[technologyIndex]) {
                    newRunTestersByTechIndex[technologyIndex].push(userId);
                } else {
                    newRunTestersByTechIndex[technologyIndex] = [userId];
                }
            }
        }

        newRunTestersByExample[exampleId] = newRunTestersByTechIndex;
        this.setState({
            runTestersByExample: newRunTestersByExample
        });
    }

    removeAllTestersFromRun(exampleId, runTechnologyIndexes) {
        let newRunTestersByExample = { ...this.state.runTestersByExample };
        let newRunTestersByTechIndex = {
            ...this.state.runTestersByExample[exampleId]
        };

        for (let technologyIndex of runTechnologyIndexes) {
            newRunTestersByTechIndex[technologyIndex] = [];
        }
        newRunTestersByExample[exampleId] = newRunTestersByTechIndex;

        this.setState({
            runTestersByExample: newRunTestersByExample
        });
    }

    handleVersionChange(event) {
        const { testSuiteVersions } = this.props;

        let versionData = testSuiteVersions.filter(
            version => version.id === parseInt(event.currentTarget.value)
        )[0];

        this.setState({
            selectedVersion: versionData.id,
            runTechnologyRows: [{}],
            runTestersByExample: {}
        });
    }

    handleNameChange(event) {
        this.setState({
            name: event.currentTarget.value
        });
    }

    handleTechnologyRowChange(runTechnologies, index) {
        let newRunTechnologies = [];
        for (let i = 0; i < this.state.runTechnologyRows.length; i++) {
            if (i === index) {
                newRunTechnologies.push(runTechnologies);
            } else {
                newRunTechnologies.push({ ...this.state.runTechnologyRows[i] });
            }
        }
        this.setState({
            runTechnologyRows: newRunTechnologies
        });
    }

    addTechnologyRow() {
        let newRunTechnologies = [...this.state.runTechnologyRows];
        newRunTechnologies.push({});
        this.setState({
            runTechnologyRows: newRunTechnologies
        });
    }

    renderTestVersionSelect() {
        const { testSuiteVersions } = this.props;

        return (
            <Form.Control
                value={this.state.selectedVersion}
                onChange={this.handleVersionChange}
                as="select"
                custom
            >
                {testSuiteVersions.map(version => {
                    return (
                        <option key={version.id} value={version.id}>
                            {version.git_hash.slice(0, 7) +
                                ' - ' +
                                version.git_commit_msg.slice(0, 30) +
                                '...'}
                        </option>
                    );
                })}
            </Form.Control>
        );
    }

    render() {
        const { testSuiteVersions, users } = this.props;

        let versionData = testSuiteVersions.filter(
            version => version.id === this.state.selectedVersion
        )[0];

        return (
            <Fragment>
                <h2>Initiate a Test Cycle</h2>
                <h3>Test Cycle Configuration</h3>
                <Form className="init-box">
                    <Row>
                        <Col>
                            <Form.Group controlId="cycleName">
                                <Form.Label>Test Cycle Name</Form.Label>
                                <Form.Control
                                    value={this.state.name}
                                    onChange={this.handleNameChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group controlId="testVersion">
                                <Form.Label>Git Commit of Tests</Form.Label>
                                {this.renderTestVersionSelect()}
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col>Assistive Technology</Col>
                        <Col>Version</Col>
                        <Col>Browser</Col>
                        <Col>Version</Col>
                    </Row>
                    {versionData &&
                        this.state.runTechnologyRows.map((runTech, index) => {
                            return (
                                <ConfigureTechnologyRow
                                    key={index}
                                    runTechnologies={runTech}
                                    index={index}
                                    availableAts={versionData.supported_ats}
                                    availableBrowsers={versionData.browsers}
                                    handleTechnologyRowChange={
                                        this.handleTechnologyRowChange
                                    }
                                />
                            );
                        })}
                    <Row>
                        <Col>
                            <Button onClick={this.addTechnologyRow}>
                                Add another AT/Browser
                            </Button>
                        </Col>
                    </Row>
                </Form>
                <h3>Test Plans</h3>
                {versionData &&
                    versionData.apg_examples.map(example => {
                        return (
                            <ConfigureRunsForExample
                                key={example.id}
                                example={example}
                                runTechnologies={this.state.runTechnologyRows}
                                availableAts={versionData.supported_ats}
                                availableBrowsers={versionData.browsers}
                                users={users}
                                assignTesters={this.assignTesters}
                                removeAllTestersFromRun={
                                    this.removeAllTestersFromRun
                                }
                                runTestersByTechIndex={
                                    this.state.runTestersByExample[example.id]
                                }
                            />
                        );
                    })}
                <div>
                    <Button onClick={this.initiateCycle}>Initiate Cycle</Button>
                </div>
            </Fragment>
        );
    }
}

InitiateCycle.propTypes = {
    testSuiteVersions: PropTypes.array,
    dispatch: PropTypes.func,
    history: PropTypes.func,
    users: PropTypes.array
};

const mapStateToProps = state => {
    const { testSuiteVersions } = state.cycles;
    const { users } = state.users;
    return { testSuiteVersions, users };
};

export default connect(mapStateToProps)(InitiateCycle);