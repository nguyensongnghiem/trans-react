import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Typography,
    Button,
    Spinner,
} from "@material-tailwind/react";
import { NavLink } from "react-router-dom";
function DashboardCard({ icon, title, content, subContent, detailUrl, color, bgColor }) {
    return (
        <Card className="mt-6 flex flex-col justify-between p-2" color={bgColor}>
            <CardBody className="p-2">

                <Typography variant="h5" className="mb-2 uppercase" color={color}>
                    {title}
                </Typography>
                <div className="text-end">
                    <Typography variant='h2'>{content}</Typography>
                </div>
                <div className="text-end">
                    <Typography variant='h5'>{subContent}</Typography>
                </div>

            </CardBody>
            <CardFooter className="p-1 text-end" divider={true} color={bgColor}  >
                <NavLink to={detailUrl}>
                    <Button
                        size="sm"
                        variant="text"
                        className="flex items-center gap-2"
                        color={color}
                    >
                        Chi tiết
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 30 30"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-4 w-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                            />
                        </svg>
                    </Button>
                </NavLink>
            </CardFooter>
        </Card >
    );
}

export default DashboardCard;