import "./TradeDataTable.css";

const getTradeRowClass = (status) => {
    switch (status) {
        case "filled":
            return "status-filled";
        case "failed":
            return "status-failed";
        case "pending":
            return "status-pending";
        default:
            return "";
    }
};

const TradeDataTable = ({ trades, formatNumber }) => (
    <div className="table-wrapper">
        <table className="table table-striped">
            <thead>
                <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Type</th>
                    <th scope="col">Crypto</th>
                    <th scope="col"># Coins</th>
                    <th scope="col">Price</th>
                    <th scope="col">$ Value</th>
                    <th scope="col">Status</th>
                    <th scope="col">Time</th>
                </tr>
            </thead>
            <tbody>
                {trades.map((trade, index) => (
                    <tr key={index} className={getTradeRowClass(trade.status)}>
                        <td>{trade.id.substring(0, 8)}</td>
                        <td>{trade.type.toUpperCase()}</td>
                        <td>{trade.crypto}</td>
                        <td>{formatNumber(parseFloat(trade.amount))}</td>
                        <td>
                            $
                            {formatNumber(
                                parseFloat(
                                    trade.price.substring(1, trade.price.length)
                                )
                            )}
                        </td>
                        <td>{trade.value}</td>
                        <td>{trade.status.toUpperCase()}</td>
                        <td>{trade.time}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default TradeDataTable;
