import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import './quizeffectiveness.css';
import { useFetch } from "../../hooks/useFetch";
import Loader from "../loader/Loader";
import loadingImg from '../../images/Loading-rafiki (1).png'
import NotFoundData from "../notFoundData/NotFoundData";

export default function Quizeffectiveness() {
    const { data: quizzes, loading, error } = useFetch('quizzes/effectiveness');

    if (loading) return <Loader />;
    if (error) return <NotFoundData message="Error loading Quizzes Effectiveness" imag={loadingImg} />;

    const safeQuizzes = Array.isArray(quizzes) ? quizzes : [];

    const filtered = safeQuizzes.filter(q =>
        ["Programming", "Math", "Chemistry"].includes(q.mainCategory)
    );

    const chartData = filtered.map(q => ({
        mainCategory: q.mainCategory,
        Easy: q.difficulty?.easy || 0,
        Medium: q.difficulty?.medium || 0,
        Hard: q.difficulty?.hard || 0,
        Completion: q.completionRate || 0
    }));

    return (
        <div className="quiz-container">
            <h1 className="quiz-title">Quiz Effectiveness</h1>
            {chartData.length > 0 ? (

                <ResponsiveContainer  width="100%" height={300}>
             

                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                        <XAxis dataKey="mainCategory" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Easy" stackId="a" fill="#e87ca3" />
                        <Bar dataKey="Medium" stackId="a" fill="#e87ca3" />
                        <Bar dataKey="Hard" stackId="a" fill="#1a1a1a" />
                        <Bar dataKey="Completion" fill="#7a1f3d" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="no-quizzes">No quizzes available</p>
            )}
        </div>
    );
}
