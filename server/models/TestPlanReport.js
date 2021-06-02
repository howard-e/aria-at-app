const MODEL_NAME = 'TestPlanReport';

const STATUS = {
    DRAFT: 'DRAFT',
    IN_REVIEW: 'IN_REVIEW',
    FINALIZED: 'FINALIZED'
};

module.exports = function(sequelize, DataTypes) {
    const Model = sequelize.define(
        MODEL_NAME,
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            status: {
                type: DataTypes.TEXT,
                // type: DataTypes.ENUM(
                //     STATUS.DRAFT,
                //     STATUS.IN_REVIEW,
                //     STATUS.FINALIZED
                // ),
                allowNull: false,
                defaultValue: STATUS.DRAFT
            },
            isInQueue: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
            testPlanTargetId: { type: DataTypes.INTEGER },
            testPlanVersionId: { type: DataTypes.INTEGER },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            timestamps: false,
            tableName: MODEL_NAME
        }
    );

    Model.DRAFT = STATUS.DRAFT;
    Model.IN_REVIEW = STATUS.IN_REVIEW;
    Model.FINALIZED = STATUS.FINALIZED;

    Model.TEST_PLAN_VERSION_ASSOCIATION = { foreignKey: 'testPlanVersionId' };

    Model.TEST_PLAN_TARGET_ASSOCIATION = { foreignKey: 'testPlanTargetId' };

    Model.TEST_PLAN_RUN_ASSOCIATION = { as: 'testPlanRuns' };

    Model.associate = function(models) {
        Model.belongsTo(models.TestPlanVersion, {
            ...Model.TEST_PLAN_VERSION_ASSOCIATION,
            targetKey: 'id',
            as: 'testPlanVersion'
        });

        Model.belongsTo(models.TestPlanTarget, {
            ...Model.TEST_PLAN_TARGET_ASSOCIATION,
            targetKey: 'id',
            as: 'testPlanTarget'
        });

        Model.hasMany(models.TestPlanRun, {
            ...Model.TEST_PLAN_RUN_ASSOCIATION,
            foreignKey: 'testPlanReportId',
            sourceKey: 'id'
        });
    };

    return Model;
};
